import { vehicleScheduleService } from '../services/vehicleScheduleService.js';

export const vehicleScheduleController = {
  async getPaginatedVehicleSchedules(req, res) {
    try {
      const {
        search = '',
        status = [],
        sortBy = 'startDate',
        sortOrder = 'desc',
        page = '1',
        limit = '6'
      } = req.query;

      // Parse query parameters
      const filters = {
        search: search.trim(),
        status: Array.isArray(status) ? status : (status ? [status] : []),
        sortBy,
        sortOrder: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
        page: Math.max(1, parseInt(page, 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 6))
      };

      const result = await vehicleScheduleService.getPaginatedVehicleSchedules(filters);
      res.json(result);
    } catch (error) {
      console.error('Get paginated vehicle schedules error:', error);
      res.status(500).json({ error: 'Failed to fetch paginated vehicle schedules' });
    }
  },

  async createVehicleSchedule(req, res) {
    try {
      const schedule = await vehicleScheduleService.createVehicleSchedule(req.body);
      res.status(201).json(schedule);
    } catch (error) {
      console.error('Add vehicle schedule error:', error);
      
      // Handle business logic errors with 409 Conflict status
      if (error.message.includes('unavailable') || 
          error.message.includes('existing schedule') || 
          error.message.includes('maintenance order') ||
          error.message.includes('Start date must be before end date') ||
          error.message.includes('Start date cannot be in the past')) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to add vehicle schedule' });
    }
  },

  async updateVehicleSchedule(req, res) {
    try {
      const { id } = req.params;
      const schedule = await vehicleScheduleService.updateVehicleSchedule(id, req.body);
      res.json(schedule);
    } catch (error) {
      console.error('Update vehicle schedule error:', error);
      
      if (error.message === 'Vehicle schedule not found') {
        return res.status(404).json({ error: error.message });
      }
      
      // Handle business logic errors with 409 Conflict status
      if (error.message.includes('unavailable') || 
          error.message.includes('existing schedule') || 
          error.message.includes('maintenance order') ||
          error.message.includes('Start date must be before end date') ||
          error.message.includes('Start date cannot be in the past')) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to update vehicle schedule' });
    }
  },

  async deleteVehicleSchedule(req, res) {
    try {
      const { id } = req.params;
      await vehicleScheduleService.deleteVehicleSchedule(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete vehicle schedule error:', error);
      res.status(500).json({ error: 'Failed to delete vehicle schedule' });
    }
  },

  async updateVehicleScheduleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const schedule = await vehicleScheduleService.updateVehicleScheduleStatus(id, status);
      res.json(schedule);
    } catch (error) {
      console.error('Update vehicle schedule status error:', error);
      if (error.message === 'Vehicle schedule not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update vehicle schedule status' });
    }
  },

  async getActiveSchedulesForVehicle(req, res) {
    try {
      const { vehicleId } = req.params;
      const schedules = await vehicleScheduleService.getActiveSchedulesForVehicle(vehicleId);
      res.json(schedules);
    } catch (error) {
      console.error('Get active vehicle schedules error:', error);
      res.status(500).json({ error: 'Failed to fetch active vehicle schedules' });
    }
  },

  async getOtherSchedulesForVehicle(req, res) {
    try {
      const { vehicleId } = req.params;
      const { exclude, status } = req.query;

      const statuses = status ? (Array.isArray(status) ? status : [status]) : [];
      const schedules = await vehicleScheduleService.getOtherSchedulesForVehicle(vehicleId, exclude, statuses);
      
      res.json(schedules);
    } catch (error) {
      console.error('Get other vehicle schedules error:', error);
      res.status(500).json({ error: 'Failed to fetch vehicle schedules' });
    }
  }
};