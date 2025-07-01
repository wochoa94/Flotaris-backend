import cron from 'node-cron';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { format, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '../config/supabase.js';

const GUATEMALA_TIMEZONE = 'America/Guatemala';

/**
 * Checks for maintenance orders that should transition from 'scheduled' to 'active'
 * based on their start_date being today or in the past
 */
async function checkScheduledToActive() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for scheduled maintenance orders to activate...`);
    
    // Get current date in Guatemala timezone
    const nowInGuatemala = utcToZonedTime(new Date(), GUATEMALA_TIMEZONE);
    const todayInGuatemala = startOfDay(nowInGuatemala);
    
    // Convert to UTC for database comparison
    const todayUTC = zonedTimeToUtc(todayInGuatemala, GUATEMALA_TIMEZONE);
    
    // Query for scheduled maintenance orders where start_date is today or in the past
    const { data: ordersToActivate, error } = await supabase
      .from('maintenance_orders')
      .select('id, vehicle_id, start_date')
      .eq('status', 'scheduled')
      .lte('start_date', todayUTC.toISOString());

    if (error) {
      console.error('Error fetching scheduled maintenance orders:', error);
      return;
    }

    if (!ordersToActivate || ordersToActivate.length === 0) {
      console.log('No scheduled maintenance orders to activate');
      return;
    }

    console.log(`Found ${ordersToActivate.length} maintenance orders to activate`);

    // Process each order using the RPC function
    for (const order of ordersToActivate) {
      try {
        const { data, error: rpcError } = await supabase.rpc('update_maintenance_order_and_vehicle_status', {
          p_order_id: order.id,
          p_new_status: 'active',
          p_cost: null,
          p_quotation_details: null,
          p_comments: null
        });

        if (rpcError) {
          console.error(`Error activating maintenance order ${order.id}:`, rpcError);
        } else {
          console.log(`Successfully activated maintenance order ${order.id} for vehicle ${order.vehicle_id}`);
        }
      } catch (orderError) {
        console.error(`Failed to activate maintenance order ${order.id}:`, orderError);
      }
    }
  } catch (error) {
    console.error('Error in checkScheduledToActive:', error);
  }
}

/**
 * Checks for maintenance orders that should transition from 'active' to 'completed'
 * based on their estimated_completion_date being today or in the past
 */
async function checkActiveToCompleted() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for active maintenance orders to complete...`);
    
    // Get current date in Guatemala timezone
    const nowInGuatemala = utcToZonedTime(new Date(), GUATEMALA_TIMEZONE);
    const todayInGuatemala = endOfDay(nowInGuatemala);
    
    // Convert to UTC for database comparison
    const todayUTC = zonedTimeToUtc(todayInGuatemala, GUATEMALA_TIMEZONE);
    
    // Query for active maintenance orders where estimated_completion_date is today or in the past
    const { data: ordersToComplete, error } = await supabase
      .from('maintenance_orders')
      .select('id, vehicle_id, estimated_completion_date')
      .eq('status', 'active')
      .lte('estimated_completion_date', todayUTC.toISOString());

    if (error) {
      console.error('Error fetching active maintenance orders:', error);
      return;
    }

    if (!ordersToComplete || ordersToComplete.length === 0) {
      console.log('No active maintenance orders to complete');
      return;
    }

    console.log(`Found ${ordersToComplete.length} maintenance orders to complete`);

    // Process each order using the RPC function
    for (const order of ordersToComplete) {
      try {
        const { data, error: rpcError } = await supabase.rpc('update_maintenance_order_and_vehicle_status', {
          p_order_id: order.id,
          p_new_status: 'completed',
          p_cost: null,
          p_quotation_details: null,
          p_comments: null
        });

        if (rpcError) {
          console.error(`Error completing maintenance order ${order.id}:`, rpcError);
        } else {
          console.log(`Successfully completed maintenance order ${order.id} for vehicle ${order.vehicle_id}`);
        }
      } catch (orderError) {
        console.error(`Failed to complete maintenance order ${order.id}:`, orderError);
      }
    }
  } catch (error) {
    console.error('Error in checkActiveToCompleted:', error);
  }
}

/**
 * Checks for vehicle schedules that should transition from 'scheduled' to 'active'
 * based on their start_date being today or in the past
 */
async function checkScheduledVehicleSchedulesToActive() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for scheduled vehicle schedules to activate...`);
    
    // Get current date in Guatemala timezone
    const nowInGuatemala = utcToZonedTime(new Date(), GUATEMALA_TIMEZONE);
    const todayInGuatemala = startOfDay(nowInGuatemala);
    
    // Convert to UTC for database comparison
    const todayUTC = zonedTimeToUtc(todayInGuatemala, GUATEMALA_TIMEZONE);
    
    // Query for scheduled vehicle schedules where start_date is today or in the past
    const { data: schedulesToActivate, error } = await supabase
      .from('vehicle_schedules')
      .select('id, vehicle_id, driver_id, start_date')
      .eq('status', 'scheduled')
      .lte('start_date', todayUTC.toISOString());

    if (error) {
      console.error('Error fetching scheduled vehicle schedules:', error);
      return;
    }

    if (!schedulesToActivate || schedulesToActivate.length === 0) {
      console.log('No scheduled vehicle schedules to activate');
      return;
    }

    console.log(`Found ${schedulesToActivate.length} vehicle schedules to activate`);

    // Process each schedule using the RPC function
    for (const schedule of schedulesToActivate) {
      try {
        const { data, error: rpcError } = await supabase.rpc('update_vehicle_schedule_and_vehicle_status', {
          p_schedule_id: schedule.id,
          p_new_status: 'active'
        });

        if (rpcError) {
          console.error(`Error activating vehicle schedule ${schedule.id}:`, rpcError);
        } else {
          console.log(`Successfully activated vehicle schedule ${schedule.id} for vehicle ${schedule.vehicle_id} with driver ${schedule.driver_id}`);
        }
      } catch (scheduleError) {
        console.error(`Failed to activate vehicle schedule ${schedule.id}:`, scheduleError);
      }
    }
  } catch (error) {
    console.error('Error in checkScheduledVehicleSchedulesToActive:', error);
  }
}

/**
 * Checks for vehicle schedules that should transition from 'active' to 'completed'
 * based on their end_date being today or in the past
 */
async function checkActiveVehicleSchedulesToCompleted() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for active vehicle schedules to complete...`);
    
    // Get current date in Guatemala timezone
    const nowInGuatemala = utcToZonedTime(new Date(), GUATEMALA_TIMEZONE);
    const todayInGuatemala = endOfDay(nowInGuatemala);
    
    // Convert to UTC for database comparison
    const todayUTC = zonedTimeToUtc(todayInGuatemala, GUATEMALA_TIMEZONE);
    
    // Query for active vehicle schedules where end_date is today or in the past
    const { data: schedulesToComplete, error } = await supabase
      .from('vehicle_schedules')
      .select('id, vehicle_id, driver_id, end_date')
      .eq('status', 'active')
      .lte('end_date', todayUTC.toISOString());

    if (error) {
      console.error('Error fetching active vehicle schedules:', error);
      return;
    }

    if (!schedulesToComplete || schedulesToComplete.length === 0) {
      console.log('No active vehicle schedules to complete');
      return;
    }

    console.log(`Found ${schedulesToComplete.length} vehicle schedules to complete`);

    // Process each schedule using the RPC function
    for (const schedule of schedulesToComplete) {
      try {
        const { data, error: rpcError } = await supabase.rpc('update_vehicle_schedule_and_vehicle_status', {
          p_schedule_id: schedule.id,
          p_new_status: 'completed'
        });

        if (rpcError) {
          console.error(`Error completing vehicle schedule ${schedule.id}:`, rpcError);
        } else {
          console.log(`Successfully completed vehicle schedule ${schedule.id} for vehicle ${schedule.vehicle_id}`);
        }
      } catch (scheduleError) {
        console.error(`Failed to complete vehicle schedule ${schedule.id}:`, scheduleError);
      }
    }
  } catch (error) {
    console.error('Error in checkActiveVehicleSchedulesToCompleted:', error);
  }
}

/**
 * Starts the maintenance and vehicle schedule scheduler with cron jobs
 */
export function startMaintenanceScheduler() {
  console.log('Starting maintenance order and vehicle schedule scheduler...');
  
  // Schedule job to check for maintenance orders to activate (runs at 00:01 Guatemala time)
  cron.schedule('1 0 * * *', checkScheduledToActive, {
    scheduled: true,
    timezone: GUATEMALA_TIMEZONE
  });
  
  // Schedule job to check for maintenance orders to complete (runs at 23:59 Guatemala time)
  cron.schedule('59 23 * * *', checkActiveToCompleted, {
    scheduled: true,
    timezone: GUATEMALA_TIMEZONE
  });
  
  // Schedule job to check for vehicle schedules to activate (runs at 00:01 Guatemala time)
  cron.schedule('1 0 * * *', checkScheduledVehicleSchedulesToActive, {
    scheduled: true,
    timezone: GUATEMALA_TIMEZONE
  });
  
  // Schedule job to check for vehicle schedules to complete (runs at 23:59 Guatemala time)
  cron.schedule('59 23 * * *', checkActiveVehicleSchedulesToCompleted, {
    scheduled: true,
    timezone: GUATEMALA_TIMEZONE
  });
  
  console.log('Maintenance order and vehicle schedule scheduler started successfully');
  console.log('- Maintenance Scheduled to Active check: Daily at 00:01 Guatemala time');
  console.log('- Maintenance Active to Completed check: Daily at 23:59 Guatemala time');
  console.log('- Vehicle Schedule Scheduled to Active check: Daily at 00:01 Guatemala time');
  console.log('- Vehicle Schedule Active to Completed check: Daily at 23:59 Guatemala time');
  
  // Run initial checks on startup (optional)
  console.log('Running initial maintenance order and vehicle schedule checks...');
  checkScheduledToActive();
  checkActiveToCompleted();
  checkScheduledVehicleSchedulesToActive();
  checkActiveVehicleSchedulesToCompleted();
}