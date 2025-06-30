import { supabase } from '../config/supabase.js';
import { convertKeysToSnakeCase, convertKeysToCamelCase } from '../utils/caseConverter.js';
import { checkOverlap, validateDateRange, validateFutureDate } from '../utils/dateUtils.js';

export const vehicleScheduleService = {
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