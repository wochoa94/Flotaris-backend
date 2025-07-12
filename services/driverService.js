import { supabase } from '../config/supabase.js';
import { convertKeysToSnakeCase, convertKeysToCamelCase } from '../utils/caseConverter.js';

export const driverService = {
  async getPaginatedDrivers(filters) {
    const {
      search,
      emailSearch,
      sortBy,
      sortOrder,
      page,
      limit
    } = filters;

    // Build the base query with vehicle information (LEFT JOIN)
    let query = supabase
      .from('drivers')
      .select(`
        *,
        vehicles!vehicles_driver_id_fkey (
          id,
          name,
          make,
          model,
          year,
          license_plate,
          mileage
        )
      `, { count: 'exact' });

    // Apply search filters
    const searchConditions = [];
    
    if (search) {
      searchConditions.push(`first_name.ilike.%${search}%`);
      searchConditions.push(`last_name.ilike.%${search}%`);
    }
    
    if (emailSearch) {
      searchConditions.push(`email.ilike.%${emailSearch}%`);
    }
    
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','));
    }

    // Apply sorting
    const sortMapping = {
      name: 'first_name',
      email: 'email',
      idNumber: 'id_number',
      createdAt: 'created_at'
    };

    const dbSortColumn = sortMapping[sortBy] || 'first_name';
    query = query.order(dbSortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: drivers, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Calculate pagination metadata
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Convert snake_case keys to camelCase for frontend
    const convertedDrivers = convertKeysToCamelCase(drivers || []);

    // Process vehicle information for each driver
    const processedDrivers = convertedDrivers.map(driver => {
      let assignedVehicle = null;
      
      // Check if driver has an assigned vehicle
      if (driver.vehicles && Array.isArray(driver.vehicles) && driver.vehicles.length > 0) {
        const vehicle = driver.vehicles[0]; // Should only be one vehicle per driver
        assignedVehicle = {
          id: vehicle.id,
          name: vehicle.name,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          mileage: vehicle.mileage
        };
      }

      return {
        ...driver,
        assignedVehicle,
        vehicles: undefined // Remove the nested vehicles array
      };
    });

    return {
      drivers: processedDrivers,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPreviousPage
    };
  },

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