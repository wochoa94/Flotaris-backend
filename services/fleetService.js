import { supabase } from '../config/supabase.js';

export const fleetService = {
  async getAllFleetData() {
    const [vehiclesResult, driversResult, maintenanceOrdersResult, vehicleSchedulesResult] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('drivers').select('*'),
      supabase.from('maintenance_orders').select('*'),
      supabase.from('vehicle_schedules').select('*')
    ]);

    if (vehiclesResult.error) throw new Error(vehiclesResult.error.message);
    if (driversResult.error) throw new Error(driversResult.error.message);
    if (maintenanceOrdersResult.error) throw new Error(maintenanceOrdersResult.error.message);
    if (vehicleSchedulesResult.error) throw new Error(vehicleSchedulesResult.error.message);

    return {
      vehicles: vehiclesResult.data || [],
      drivers: driversResult.data || [],
      maintenance_orders: maintenanceOrdersResult.data || [],
      vehicle_schedules: vehicleSchedulesResult.data || []
    };
  }
};