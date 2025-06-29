import { supabase } from '../config/supabase.js';

export const vehicleService = {
  async getAllVehicles() {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) throw new Error(error.message);
    return data;
  },

  async createVehicle(vehicleData) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateVehicle(id, vehicleData) {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Vehicle not found');
    }

    return data;
  },

  async deleteVehicle(id) {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async getVehicleById(id) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Vehicle not found');
    }

    return data;
  },

  async updateVehicleStatus(id, updateData) {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Vehicle not found');
    }

    return data;
  }
};