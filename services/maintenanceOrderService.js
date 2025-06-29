import { supabase } from '../config/supabase.js';

export const maintenanceOrderService = {
  async createMaintenanceOrder(orderData) {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .insert(orderData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateMaintenanceOrder(id, orderData) {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .update(orderData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Maintenance order not found');
    }

    return data;
  },

  async deleteMaintenanceOrder(id) {
    const { error } = await supabase
      .from('maintenance_orders')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async updateMaintenanceOrderStatus(id, statusData) {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .update(statusData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Maintenance order not found');
    }

    return data;
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
    return data || [];
  }
};