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
    const vehicles = convertKeysToCamelCase(vehiclesResult.data || []);
    const drivers = convertKeysToCamelCase(driversResult.data || []);
    const maintenanceOrders = convertKeysToCamelCase(maintenanceOrdersResult.data || []);
    const vehicleSchedules = convertKeysToCamelCase(vehicleSchedulesResult.data || []);

    // Calculate summary aggregations
    const summary = {
      totalVehicles: vehicles.length,
      totalDrivers: drivers.length,
      activeVehiclesCount: vehicles.filter(vehicle => vehicle.status === 'active').length,
      totalMaintenanceCost: vehicles.reduce((total, vehicle) => {
        return total + (vehicle.maintenanceCost || 0);
      }, 0),
      vehicleStatusCounts: {
        active: 0,
        maintenance: 0,
        idle: 0
      },
      maintenanceOrdersStatusCounts: {
        active: 0,
        scheduled: 0,
        pending_authorization: 0
      },
      vehicleSchedulesStatusCounts: {
        active: 0,
        scheduled: 0
      },
      highestMaintenanceCostVehicle: null,
      lowestMaintenanceCostVehicle: null
    };

    // Calculate vehicle status counts
    vehicles.forEach(vehicle => {
      const status = vehicle.status;
      if (status === 'active') {
        summary.vehicleStatusCounts.active++;
      } else if (status === 'maintenance') {
        summary.vehicleStatusCounts.maintenance++;
      } else if (status === 'idle') {
        summary.vehicleStatusCounts.idle++;
      }
    });

    // Calculate maintenance orders status counts (excluding completed)
    maintenanceOrders.forEach(order => {
      const status = order.status;
      if (status === 'active') {
        summary.maintenanceOrdersStatusCounts.active++;
      } else if (status === 'scheduled') {
        summary.maintenanceOrdersStatusCounts.scheduled++;
      } else if (status === 'pending_authorization') {
        summary.maintenanceOrdersStatusCounts.pending_authorization++;
      }
    });

    // Calculate vehicle schedules status counts (excluding completed)
    vehicleSchedules.forEach(schedule => {
      const status = schedule.status;
      if (status === 'active') {
        summary.vehicleSchedulesStatusCounts.active++;
      } else if (status === 'scheduled') {
        summary.vehicleSchedulesStatusCounts.scheduled++;
      }
    });

    // Find highest and lowest maintenance cost vehicles
    const vehiclesWithMaintenanceCost = vehicles.filter(vehicle => 
      vehicle.maintenanceCost !== null && 
      vehicle.maintenanceCost !== undefined && 
      vehicle.maintenanceCost > 0
    );

    if (vehiclesWithMaintenanceCost.length > 0) {
      // Find highest maintenance cost vehicle
      const highestCostVehicle = vehiclesWithMaintenanceCost.reduce((max, vehicle) => 
        vehicle.maintenanceCost > max.maintenanceCost ? vehicle : max
      );

      summary.highestMaintenanceCostVehicle = {
        id: highestCostVehicle.id,
        name: highestCostVehicle.name,
        maintenanceCost: highestCostVehicle.maintenanceCost,
        licensePlate: highestCostVehicle.licensePlate || null
      };

      // Find lowest maintenance cost vehicle
      const lowestCostVehicle = vehiclesWithMaintenanceCost.reduce((min, vehicle) => 
        vehicle.maintenanceCost < min.maintenanceCost ? vehicle : min
      );

      summary.lowestMaintenanceCostVehicle = {
        id: lowestCostVehicle.id,
        name: lowestCostVehicle.name,
        maintenanceCost: lowestCostVehicle.maintenanceCost,
        licensePlate: lowestCostVehicle.licensePlate || null
      };
    }

    return {
      vehicles,
      drivers,
      maintenanceOrders,
      vehicleSchedules,
      summary
    };
  }
};