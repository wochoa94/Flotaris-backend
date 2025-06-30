import { supabase } from '../config/supabase.js';
import { convertKeysToCamelCase } from '../utils/caseConverter.js';

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

    // Convert all snake_case keys to camelCase for frontend
    return {
      vehicles: convertKeysToCamelCase(vehiclesResult.data || []),
      drivers: convertKeysToCamelCase(driversResult.data || []),
      maintenanceOrders: convertKeysToCamelCase(maintenanceOrdersResult.data || []),
      vehicleSchedules: convertKeysToCamelCase(vehicleSchedulesResult.data || [])
    };
  }
};