import { supabase } from '../config/supabase.js';

export const driverService = {
  async createDriver(driverData) {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driverData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateDriver(id, driverData) {
    const { data, error } = await supabase
      .from('drivers')
      .update(driverData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Driver not found');
    }

    return data;
  },

  async deleteDriver(id) {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async checkEmailUniqueness(email) {
    const { data, error } = await supabase
      .from('drivers')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (error) throw new Error(error.message);
    
    return { isUnique: data.length === 0 };
  }
};