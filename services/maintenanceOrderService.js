import { supabase } from '../config/supabase.js';
import { convertKeysToSnakeCase, convertKeysToCamelCase } from '../utils/caseConverter.js';

export const maintenanceOrderService = {
  async createMaintenanceOrder(orderData) {
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(orderData);
    
    const { data, error } = await supabase
      .from('maintenance_orders')
      .insert(snakeCaseData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
  },

  async updateMaintenanceOrder(id, orderData) {
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