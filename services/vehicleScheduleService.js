import { supabase } from '../config/supabase.js';
import { convertKeysToSnakeCase, convertKeysToCamelCase } from '../utils/caseConverter.js';

export const vehicleScheduleService = {
  async createVehicleSchedule(scheduleData) {
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(scheduleData);
    
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .insert(snakeCaseData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
  },

  async updateVehicleSchedule(id, scheduleData) {
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