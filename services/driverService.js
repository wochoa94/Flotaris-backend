import { supabase } from '../config/supabase.js';
import { convertKeysToSnakeCase, convertKeysToCamelCase } from '../utils/caseConverter.js';

export const driverService = {
  async createDriver(driverData) {
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(driverData);
    
    const { data, error } = await supabase
      .from('drivers')
      .insert(snakeCaseData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
  },

  async updateDriver(id, driverData) {
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(driverData);
    
    const { data, error } = await supabase
      .from('drivers')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Driver not found');
    }

    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
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
    
    // This return value doesn't contain database keys, so no conversion needed
    return { isUnique: data.length === 0 };
  }
};