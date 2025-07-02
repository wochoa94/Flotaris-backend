import { vehicleService } from '../services/vehicleService.js';

export const vehicleController = {
  async getAllVehicles(req, res) {
    try {
      const vehicles = await vehicleService.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
  },

  async getPaginatedVehicles(req, res) {
    try {
      const {
        search = '',
        status = [],
        unassignedOnly = 'false',
        sortBy = 'vehicleName',
        sortOrder = 'asc',
        page = '1',
        limit = '10'
      } = req.query;

      // Parse query parameters
      const filters = {
        search: search.trim(),
        status: Array.isArray(status) ? status : (status ? [status] : []),
        unassignedOnly: unassignedOnly === 'true',
        sortBy,
        sortOrder: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
        page: Math.max(1, parseInt(page, 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10))
      };

      const result = await vehicleService.getPaginatedVehicles(filters);
      res.json(result);
    } catch (error) {
      console.error('Get paginated vehicles error:', error);
      res.status(500).json({ error: 'Failed to fetch paginated vehicles' });
    }
  },

  async createVehicle(req, res) {
    try {
      const vehicle = await vehicleService.createVehicle(req.body);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error('Add vehicle error:', error);
      res.status(500).json({ error: 'Failed to add vehicle' });
    }
  },

  async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.updateVehicle(id, req.body);
      res.json(vehicle);
    } catch (error) {
      console.error('Update vehicle error:', error);
      if (error.message === 'Vehicle not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update vehicle' });
    }
  },

  async deleteVehicle(req, res) {
    try {
      const { id } = req.params;
      await vehicleService.deleteVehicle(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete vehicle error:', error);
      res.status(500).json({ error: 'Failed to delete vehicle' });
    }
  },

  async getVehicleById(req, res) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.getVehicleById(id);
      res.json(vehicle);
    } catch (error) {
      console.error('Get vehicle error:', error);
      if (error.message === 'Vehicle not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
  },

  async updateVehicleStatus(req, res) {
    try {
      const { id } = req.params;
      const updateData = {};
      
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.driver_id !== undefined) updateData.driver_id = req.body.driver_id;

      const vehicle = await vehicleService.updateVehicleStatus(id, updateData);
      res.json(vehicle);
    } catch (error) {
      console.error('Update vehicle status error:', error);
      if (error.message === 'Vehicle not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update vehicle status' });
    }
  }
};