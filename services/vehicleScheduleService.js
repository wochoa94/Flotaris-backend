import { supabase } from '../config/supabase.js';
import { convertKeysToSnakeCase, convertKeysToCamelCase } from '../utils/caseConverter.js';
import { checkOverlap, validateDateRange, validateFutureDate } from '../utils/dateUtils.js';

export const vehicleScheduleService = {
  async getPaginatedVehicleSchedules(filters) {
    const {
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit
    } = filters;

    // Build the base query with vehicle and driver information (LEFT JOINs)
    let query = supabase
      .from('vehicle_schedules')
      .select(`
        *,
        vehicles!vehicle_schedules_vehicle_id_fkey (
          id,
          name,
          make,
          model,
          year,
          license_plate,
          mileage
        ),
        drivers!vehicle_schedules_driver_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      const searchConditions = [
        `vehicles.name.ilike.%${search}%`,
        `drivers.first_name.ilike.%${search}%`,
        `drivers.last_name.ilike.%${search}%`,
        `notes.ilike.%${search}%`
      ];
      query = query.or(searchConditions.join(','));
    }

    // Apply status filter
    if (status.length > 0) {
      query = query.in('status', status);
    }

    // Apply sorting
    const sortMapping = {
      vehicleName: 'vehicles.name',
      driverName: 'drivers.first_name',
      startDate: 'start_date',
      endDate: 'end_date',
      status: 'status'
    };

    const dbSortColumn = sortMapping[sortBy] || 'start_date';
    
    // Handle joined table sorting specially
    if (sortBy === 'vehicleName') {
      query = query.order('vehicles(name)', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'driverName') {
      query = query.order('drivers(first_name)', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order(dbSortColumn, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: vehicleSchedules, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Calculate pagination metadata
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Convert snake_case keys to camelCase for frontend
    const convertedSchedules = convertKeysToCamelCase(vehicleSchedules || []);

    // Process vehicle and driver information for each schedule
    const processedSchedules = convertedSchedules.map(schedule => {
      let vehicle = null;
      let driver = null;
      
      // Process vehicle information
      if (schedule.vehicles && schedule.vehicles.id) {
        const vehicleData = schedule.vehicles;
        vehicle = {
          id: vehicleData.id,
          name: vehicleData.name,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          licensePlate: vehicleData.licensePlate,
          mileage: vehicleData.mileage
        };
      }

      // Process driver information
      if (schedule.drivers && schedule.drivers.id) {
        const driverData = schedule.drivers;
        driver = {
          id: driverData.id,
          name: `${driverData.firstName} ${driverData.lastName}`,
          firstName: driverData.firstName,
          lastName: driverData.lastName,
          email: driverData.email
        };
      }

      return {
        ...schedule,
        vehicle,
        driver,
        vehicles: undefined, // Remove the nested vehicles object
        drivers: undefined   // Remove the nested drivers object
      };
    });

    return {
      vehicleSchedules: processedSchedules,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPreviousPage
    };
  },

  async createVehicleSchedule(scheduleData) {
    const { vehicleId, driverId, startDate, endDate } = scheduleData;

    // Validate date inputs
    validateDateRange(startDate, endDate);
    validateFutureDate(startDate);

    const newScheduleStart = new Date(startDate);
    const newScheduleEnd = new Date(endDate);

    // 1. Check for vehicle schedule overlaps
    const { data: existingVehicleSchedules, error: vehicleScheduleError } = await supabase
      .from('vehicle_schedules')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .in('status', ['active', 'scheduled']);

    if (vehicleScheduleError) throw new Error(vehicleScheduleError.message);

    const vehicleOverlap = existingVehicleSchedules?.some(schedule =>
      checkOverlap(
        newScheduleStart,
        newScheduleEnd,
        new Date(schedule.start_date),
        new Date(schedule.end_date)
      )
    );

    if (vehicleOverlap) {
      throw new Error('Vehicle unavailable during selected dates due to existing schedule');
    }

    // 2. Check for maintenance order overlaps for the vehicle
    const { data: existingMaintenanceOrders, error: maintenanceError } = await supabase
      .from('maintenance_orders')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .in('status', ['active', 'scheduled']);

    if (maintenanceError) throw new Error(maintenanceError.message);

    const maintenanceOverlap = existingMaintenanceOrders?.some(order =>
      checkOverlap(
        newScheduleStart,
        newScheduleEnd,
        new Date(order.start_date),
        new Date(order.estimated_completion_date)
      )
    );

    if (maintenanceOverlap) {
      throw new Error('Vehicle unavailable during selected dates due to maintenance order');
    }

    // 3. Check for driver schedule overlaps (if driver is assigned)
    if (driverId) {
      const { data: existingDriverSchedules, error: driverScheduleError } = await supabase
        .from('vehicle_schedules')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['active', 'scheduled']);

      if (driverScheduleError) throw new Error(driverScheduleError.message);

      const driverOverlap = existingDriverSchedules?.some(schedule =>
        checkOverlap(
          newScheduleStart,
          newScheduleEnd,
          new Date(schedule.start_date),
          new Date(schedule.end_date)
        )
      );

      if (driverOverlap) {
        throw new Error('Driver unavailable during selected dates due to existing schedule');
      }
    }

    // If no overlaps, proceed with creation
    const snakeCaseData = convertKeysToSnakeCase(scheduleData);
    
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .insert(snakeCaseData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return convertKeysToCamelCase(data);
  },

  async updateVehicleSchedule(id, scheduleData) {
    const { vehicleId, driverId, startDate, endDate } = scheduleData;

    // Only validate dates if they are being updated
    if (startDate && endDate) {
      validateDateRange(startDate, endDate);
      validateFutureDate(startDate);

      const newScheduleStart = new Date(startDate);
      const newScheduleEnd = new Date(endDate);

      // 1. Check for vehicle schedule overlaps (excluding current schedule)
      const { data: existingVehicleSchedules, error: vehicleScheduleError } = await supabase
        .from('vehicle_schedules')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .neq('id', id)
        .in('status', ['active', 'scheduled']);

      if (vehicleScheduleError) throw new Error(vehicleScheduleError.message);

      const vehicleOverlap = existingVehicleSchedules?.some(schedule =>
        checkOverlap(
          newScheduleStart,
          newScheduleEnd,
          new Date(schedule.start_date),
          new Date(schedule.end_date)
        )
      );

      if (vehicleOverlap) {
        throw new Error('Vehicle unavailable during selected dates due to existing schedule');
      }

      // 2. Check for maintenance order overlaps for the vehicle
      const { data: existingMaintenanceOrders, error: maintenanceError } = await supabase
        .from('maintenance_orders')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .in('status', ['active', 'scheduled']);

      if (maintenanceError) throw new Error(maintenanceError.message);

      const maintenanceOverlap = existingMaintenanceOrders?.some(order =>
        checkOverlap(
          newScheduleStart,
          newScheduleEnd,
          new Date(order.start_date),
          new Date(order.estimated_completion_date)
        )
      );

      if (maintenanceOverlap) {
        throw new Error('Vehicle unavailable during selected dates due to maintenance order');
      }

      // 3. Check for driver schedule overlaps (if driver is assigned)
      if (driverId) {
        const { data: existingDriverSchedules, error: driverScheduleError } = await supabase
          .from('vehicle_schedules')
          .select('*')
          .eq('driver_id', driverId)
          .neq('id', id)
          .in('status', ['active', 'scheduled']);

        if (driverScheduleError) throw new Error(driverScheduleError.message);

        const driverOverlap = existingDriverSchedules?.some(schedule =>
          checkOverlap(
            newScheduleStart,
            newScheduleEnd,
            new Date(schedule.start_date),
            new Date(schedule.end_date)
          )
        );

        if (driverOverlap) {
          throw new Error('Driver unavailable during selected dates due to existing schedule');
        }
      }
    }

    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(scheduleData);
    
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Vehicle schedule not found');
    }

    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
  },

  async deleteVehicleSchedule(id) {
    const { error } = await supabase
      .from('vehicle_schedules')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async updateVehicleScheduleStatus(id, status) {
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Vehicle schedule not found');
    }

    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
  },

  async getActiveSchedulesForVehicle(vehicleId) {
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active');

    if (error) throw new Error(error.message);
    
    // Convert snake_case keys to camelCase for frontend
    return convertKeysToCamelCase(data || []);
  },

  async getOtherSchedulesForVehicle(vehicleId, excludeId, statuses = []) {
    let query = supabase
      .from('vehicle_schedules')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    if (statuses.length > 0) {
      query = query.in('status', statuses);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    
    // Convert snake_case keys to camelCase for frontend
    return convertKeysToCamelCase(data || []);
  }
};