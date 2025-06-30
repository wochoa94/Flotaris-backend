import { supabase } from '../config/supabase.js';
import { convertKeysToSnakeCase, convertKeysToCamelCase } from '../utils/caseConverter.js';
import { checkOverlap, validateDateRange, validateFutureDate } from '../utils/dateUtils.js';

export const maintenanceOrderService = {
  async createMaintenanceOrder(orderData) {
    const { vehicleId, startDate, estimatedCompletionDate } = orderData;

    // Validate date inputs
    validateDateRange(startDate, estimatedCompletionDate);
    validateFutureDate(startDate);

    const newOrderStart = new Date(startDate);
    const newOrderEnd = new Date(estimatedCompletionDate);

    // 1. Check for maintenance order overlaps for the same vehicle
    const { data: existingMaintenanceOrders, error: maintenanceError } = await supabase
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
    const { data: existingVehicleSchedules, error: vehicleScheduleError } = await supabase
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
    
    const { data, error } = await supabase
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
      const { data: existingMaintenanceOrders, error: maintenanceError } = await supabase
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
      const { data: existingVehicleSchedules, error: vehicleScheduleError } = await supabase
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
    
    const { data, error } = await supabase
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
    const { error } = await supabase
      .from('maintenance_orders')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async updateMaintenanceOrderStatus(id, statusData) {
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(statusData);
    
    const { data, error } = await supabase
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

  async getMaintenanceOrdersByVehicle(vehicleId, statuses = []) {
    let query = supabase
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
  }
};