import { supabase } from '../config/supabase.js';

export const vehicleScheduleService = {
  async createVehicleSchedule(scheduleData) {
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .insert(scheduleData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateVehicleSchedule(id, scheduleData) {
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .update(scheduleData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Vehicle schedule not found');
    }

    return data;
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

    return data;
  },

  async getActiveSchedulesForVehicle(vehicleId) {
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active');

    if (error) throw new Error(error.message);
    return data || [];
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
    return data || [];
  }
};