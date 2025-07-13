import { supabase } from '../config/supabase.js';
import { convertKeysToSnakeCase, convertKeysToCamelCase } from '../utils/caseConverter.js';

export const vehicleService = {
  async getAllVehicles() {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) throw new Error(error.message);
    
    // Convert snake_case keys to camelCase for frontend
    return convertKeysToCamelCase(data);
  },

  async getPaginatedVehicles(filters) {
    const {
      search,
      status,
      unassignedOnly,
      sortBy,
      sortOrder,
      page,
      limit
    } = filters;

    // Build the base query with driver information
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        drivers:driver_id (
          id,
          name,
          email
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,vin.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
    }

    // Apply status filter
    if (status.length > 0) {
      query = query.in('status', status);
    }

    // Apply unassigned driver filter
    if (unassignedOnly) {
      query = query.is('driver_id', null);
    }

    // Apply sorting
    const sortMapping = {
      vehicleName: 'name',
      status: 'status',
      mileage: 'mileage',
      maintenanceCost: 'maintenance_cost',
      assignedDriver: 'driver_id'
    };

    const dbSortColumn = sortMapping[sortBy] || 'name';
    
    // Special handling for driver sorting
    if (sortBy === 'assignedDriver') {
      // For driver sorting, we need to handle nulls properly
      if (sortOrder === 'asc') {
        query = query.order('driver_id', { ascending: true, nullsFirst: true });
      } else {
        query = query.order('driver_id', { ascending: false, nullsLast: true });
      }
    } else {
      query = query.order(dbSortColumn, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: vehicles, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Calculate pagination metadata
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Convert snake_case keys to camelCase for frontend
    const convertedVehicles = convertKeysToCamelCase(vehicles || []);

    // Process driver information for each vehicle
    const processedVehicles = convertedVehicles.map(vehicle => {
      if (vehicle.drivers && vehicle.drivers.id) {
        // If driver exists, format the driver name
        const driver = vehicle.drivers;
        return {
          ...vehicle,
          assignedDriverName: driver.name,
          assignedDriverEmail: driver.email,
          drivers: undefined // Remove the nested drivers object
        };
      } else {
        // If no driver assigned
        return {
          ...vehicle,
          assignedDriverName: null,
          assignedDriverEmail: null,
          drivers: undefined // Remove the nested drivers object
        };
      }
    });

    return {
      vehicles: processedVehicles,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPreviousPage
    };
  },

  async createVehicle(vehicleData) {
    // Manually map vehicleName to name if present, as per database schema
    let dataForDb = { ...vehicleData };
    if (dataForDb.vehicleName !== undefined) {
      dataForDb.name = dataForDb.vehicleName;
      delete dataForDb.vehicleName; // Remove the old property
    }
    
    // Manually map assignedDriverId to driverId if present, as per database schema
    if (dataForDb.assignedDriverId !== undefined) {
      dataForDb.driverId = dataForDb.assignedDriverId;
      delete dataForDb.assignedDriverId; // Remove the old property
    }
    
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(dataForDb);
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert(snakeCaseData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
  },

  async updateVehicle(id, vehicleData) {
    // Manually map vehicleName to name if present, as per database schema
    let dataForDb = { ...vehicleData };
    if (dataForDb.vehicleName !== undefined) {
      dataForDb.name = dataForDb.vehicleName;
      delete dataForDb.vehicleName; // Remove the old property
    }
    
    // Manually map assignedDriverId to driverId if present, as per database schema
    if (dataForDb.assignedDriverId !== undefined) {
      dataForDb.driverId = dataForDb.assignedDriverId;
      delete dataForDb.assignedDriverId; // Remove the old property
    }
    
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(dataForDb);
    
    const { data, error } = await supabase
      .from('vehicles')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Vehicle not found');
    }

    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
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
      .select(`
        *,
        drivers:driver_id (
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Vehicle not found');
    }

    // Convert snake_case keys to camelCase for frontend
    const convertedData = convertKeysToCamelCase(data);
    
    // Process driver information and denormalize it
    let processedVehicle = { ...convertedData };
    
    if (convertedData.drivers && convertedData.drivers.id) {
      // Driver is assigned - add denormalized driver info
      processedVehicle.assignedDriverName = convertedData.drivers.name;
      processedVehicle.assignedDriverEmail = convertedData.drivers.email;
    } else {
      // No driver assigned
      processedVehicle.assignedDriverName = null;
      processedVehicle.assignedDriverEmail = null;
    }
    
    // Remove the nested drivers object to maintain clean response structure
    delete processedVehicle.drivers;
    
    return processedVehicle;
  },

  async updateVehicleStatus(id, updateData) {
    // Manually map vehicleName to name if present, as per database schema
    let dataForDb = { ...updateData };
    if (dataForDb.vehicleName !== undefined) {
      dataForDb.name = dataForDb.vehicleName;
      delete dataForDb.vehicleName; // Remove the old property
    }
    
    // Manually map assignedDriverId to driverId if present, as per database schema
    if (dataForDb.assignedDriverId !== undefined) {
      dataForDb.driverId = dataForDb.assignedDriverId;
      delete dataForDb.assignedDriverId; // Remove the old property
    }
    
    // Convert camelCase keys to snake_case for database
    const snakeCaseData = convertKeysToSnakeCase(dataForDb);
    
    const { data, error } = await supabase
      .from('vehicles')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Vehicle not found');
    }

    // Convert snake_case keys back to camelCase for frontend
    return convertKeysToCamelCase(data);
  }
};