import { supabaseAdmin } from '../config/supabase.js';
import { convertKeysToSnakeCase, convertKeysToCamelCase } from '../utils/caseConverter.js';
import { checkOverlap, validateDateRange, validateFutureDate, GUATEMALA_TIMEZONE } from '../utils/dateUtils.js';
import { startOfDay, endOfDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';

export const maintenanceOrderService = {
  async getPaginatedMaintenanceOrders(filters) {
    const {
      search,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      page,
      limit
    } = filters;

    // Build the base query with vehicle information (LEFT JOIN)
    let query = supabaseAdmin
      .from('maintenance_orders')
      .select(`
        *,
        vehicles!maintenance_orders_vehicle_id_fkey (
          id,
          name,
          make,
          model,
          year,
          license_plate,
          mileage
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      const searchConditions = [
        `order_number.ilike.%${search}%`,
        `description.ilike.%${search}%`,
        `location.ilike.%${search}%`,
        `type.ilike.%${search}%`,
        `vehicles.name.ilike.%${search}%`,
        `vehicles.make.ilike.%${search}%`,
        `vehicles.model.ilike.%${search}%`
      ];
      query = query.or(searchConditions.join(','));
    }

    // Apply status filter
    if (status.length > 0) {
      query = query.in('status', status);
    }

    // Apply date range filter if provided
    if (startDate && endDate) {
      // Parse dates in Guatemala timezone and convert to UTC for database comparison
      const startDateInGuatemala = startOfDay(new Date(startDate));
      const endDateInGuatemala = endOfDay(new Date(endDate));
      
      const parsedStartDate = zonedTimeToUtc(startDateInGuatemala, GUATEMALA_TIMEZONE).toISOString();
      const parsedEndDate = zonedTimeToUtc(endDateInGuatemala, GUATEMALA_TIMEZONE).toISOString();
      
      // Apply overlap condition: maintenance order overlaps with requested range if:
      // order.start_date <= requestedEndDate AND order.estimated_completion_date >= requestedStartDate
      query = query.lte('start_date', parsedEndDate);
      query = query.gte('estimated_completion_date', parsedStartDate);
    }

    // Apply sorting
    const sortMapping = {
      orderNumber: 'order_number',
      vehicleName: 'vehicles.name',
      startDate: 'start_date',
      estimatedCompletionDate: 'estimated_completion_date',
      cost: 'cost',
      status: 'status',
      urgent: 'urgent',
      createdAt: 'created_at'
    };

    const dbSortColumn = sortMapping[sortBy] || 'order_number';
    
    // Handle vehicle name sorting specially since it's from joined table
    if (sortBy === 'vehicleName') {
      query = query.order('vehicles(name)', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order(dbSortColumn, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: maintenanceOrders, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Calculate pagination metadata
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Convert snake_case keys to camelCase for frontend
    const convertedOrders = convertKeysToCamelCase(maintenanceOrders || []);

    // Process vehicle information for each maintenance order
    const processedOrders = convertedOrders.map(order => {
      let vehicle = null;
      
      // Check if maintenance order has an associated vehicle
      if (order.vehicles && order.vehicles.id) {
        const vehicleData = order.vehicles;
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

      return {
        ...order,
        vehicle,
        vehicles: undefined // Remove the nested vehicles object
      };
    });

    return {
      maintenanceOrders: processedOrders,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPreviousPage
    };
  },

  async createMaintenanceOrder(orderData) {
    const { vehicleId, startDate, estimatedCompletionDate } = orderData;

    // Validate date inputs
    validateDateRange(startDate, estimatedCompletionDate);
    validateFutureDate(startDate);

    const newOrderStart = new Date(startDate);
    const newOrderEnd = new Date(estimatedCompletionDate);

    // 1. Check for maintenance order overlaps for the same vehicle
    const { data: existingMaintenanceOrders, error: maintenanceError } = await supabaseAdmin
      .from('maintenance_orders')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .in('status', ['active', 'scheduled']);

    if (maintenanceError) throw new Error(maintenanceError.message);

    const maintenanceOverlap = existingMaintenanceOrders?.some(order =>
      checkOverlap(
        newOrderStart,
        newOrderEnd,
        new Date(order.start_date),
        new Date(order.estimated_completion_date)
      )
    );

    if (maintenanceOverlap) {
      throw new Error('Vehicle already has a maintenance order during this period');
    }

    // 2. Check for vehicle schedule overlaps
    const { data: existingVehicleSchedules, error: vehicleScheduleError } = await supabaseAdmin
      .from('vehicle_schedules')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .in('status', ['active', 'scheduled']);

    if (vehicleScheduleError) throw new Error(vehicleScheduleError.message);

    const scheduleOverlap = existingVehicleSchedules?.some(schedule =>
      checkOverlap(
        newOrderStart,
        newOrderEnd,
        new Date(schedule.start_date),
        new Date(schedule.end_date)
      )
    );

    if (scheduleOverlap) {
      throw new Error('Vehicle is scheduled for a trip during this maintenance period');
    }

    // If no overlaps, proceed with creation
    const snakeCaseData = convertKeysToSnakeCase(orderData);
    
    const { data, error } = await supabaseAdmin
      .from('maintenance_orders')
      .insert(snakeCaseData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    return convertKeysToCamelCase(data);
  },

  async updateMaintenanceOrder(id, orderData) {
    const { vehicleId, startDate, estimatedCompletionDate } = orderData;

    // Only validate dates if they are being updated
    if (startDate && estimatedCompletionDate) {
      validateDateRange(startDate, estimatedCompletionDate);
      validateFutureDate(startDate);

      const newOrderStart = new Date(startDate);
      const newOrderEnd = new Date(estimatedCompletionDate);

      // 1. Check for maintenance order overlaps (excluding current order)
      const { data: existingMaintenanceOrders, error: maintenanceError } = await supabaseAdmin
        .from('maintenance_orders')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .neq('id', id)
        .in('status', ['active', 'scheduled']);

      if (maintenanceError) throw new Error(maintenanceError.message);

      const maintenanceOverlap = existingMaintenanceOrders?.some(order =>
        checkOverlap(
          newOrderStart,
          newOrderEnd,
          new Date(order.start_date),
          new Date(order.estimated_completion_date)
        )
      );

      if (maintenanceOverlap) {
        throw new Error('Vehicle already has a maintenance order during this period');
      }

      // 2. Check for vehicle schedule overlaps
      const { data: existingVehicleSchedules, error: vehicleScheduleError } = await supabaseAdmin
        .from('vehicle_schedules')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .in('status', ['active', 'scheduled']);

      if (vehicleScheduleError) throw new Error(vehicleScheduleError.message);

      const scheduleOverlap = existingVehicleSchedules?.some(schedule =>
        checkOverlap(
          newOrderStart,
          newOrderEnd,
          new Date(schedule.start_date),
          new Date(schedule.end_date)
        )
      );

      if (scheduleOverlap) {
        throw new Error('Vehicle is scheduled for a trip during this maintenance period');
      }
    }

    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(orderData);
    
    const { data, error } = await supabaseAdmin
      .from('maintenance_orders')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Maintenance order not found');
    }

    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
  },

  async deleteMaintenanceOrder(id) {
    const { error } = await supabaseAdmin
      .from('maintenance_orders')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async updateMaintenanceOrderStatus(id, statusData) {
    // Extract parameters for the RPC function
    const { status, cost, quotationDetails, comments } = statusData;

    // Call the PostgreSQL RPC function for atomic updates
    const { data, error } = await supabaseAdmin.rpc('update_maintenance_order_and_vehicle_status', {
      p_order_id: id,
      p_new_status: status,
      p_cost: cost || null,
      p_quotation_details: quotationDetails || null,
      p_comments: comments || null
    });

    if (error) throw new Error(error.message);
    
    if (!data || data.length === 0) {
      throw new Error('No data returned from status update');
    }

    // Extract the updated maintenance order from the RPC response
    const updatedMaintenanceOrder = data[0]?.updated_maintenance_order;
    
    if (!updatedMaintenanceOrder) {
      throw new Error('Failed to retrieve updated maintenance order');
    }

    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(updatedMaintenanceOrder);
  },

  async getMaintenanceOrdersByVehicle(vehicleId, statuses = []) {
    let query = supabaseAdmin
      .from('maintenance_orders')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (statuses.length > 0) {
      query = query.in('status', statuses);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    
    // Convert snake_case keys to camelCase for frontend
    return convertKeysToCamelCase(data || []);
  },

  async getMaintenanceOrderSummary() {
    // Fetch all maintenance orders with status and cost
    const { data, error } = await supabaseAdmin
      .from('maintenance_orders')
      .select('status, cost');

    if (error) throw new Error(error.message);

    // Initialize counters and sum
    const summary = {
      active: 0,
      scheduled: 0,
      pending_authorization: 0,
      totalCompletedCost: 0
    };

    // Process each maintenance order
    (data || []).forEach(order => {
      const { status, cost } = order;

      // Count orders by status
      if (status === 'active') {
        summary.active++;
      } else if (status === 'scheduled') {
        summary.scheduled++;
      } else if (status === 'pending_authorization') {
        summary.pending_authorization++;
      } else if (status === 'completed') {
        // Add cost to total for completed orders (treat null/undefined as 0)
        summary.totalCompletedCost += cost || 0;
      }
    });

    return summary;
  }
};