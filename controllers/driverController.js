import { driverService } from '../services/driverService.js';

export const driverController = {
  async getAllDrivers(req, res) {
    try {
      const drivers = await driverService.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error('Get all drivers error:', error);
      res.status(500).json({ error: 'Failed to fetch all drivers' });
    }
  },

  async getPaginatedDrivers(req, res) {
    try {
      const {
        search = '',
        emailSearch = '',
        sortBy = 'name',
        sortOrder = 'asc',
        page = '1',
        limit = '10'
      } = req.query;

      // Parse query parameters
      const filters = {
        search: search.trim(),
        emailSearch: emailSearch.trim(),
        sortBy,
        sortOrder: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
        page: Math.max(1, parseInt(page, 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10))
      };

      const result = await driverService.getPaginatedDrivers(filters);
      res.json(result);
    } catch (error) {
      console.error('Get paginated drivers error:', error);
      res.status(500).json({ error: 'Failed to fetch paginated drivers' });
    }
  },

  async createDriver(req, res) {
    try {
      const driver = await driverService.createDriver(req.body);
      res.status(201).json(driver);
    } catch (error) {
      console.error('Add driver error:', error);
      res.status(500).json({ error: 'Failed to add driver' });
    }
  },

  async updateDriver(req, res) {
    try {
      const { id } = req.params;
      const driver = await driverService.updateDriver(id, req.body);
      res.json(driver);
    } catch (error) {
      console.error('Update driver error:', error);
      if (error.message === 'Driver not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update driver' });
    }
  },

  async deleteDriver(req, res) {
    try {
      const { id } = req.params;
      await driverService.deleteDriver(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete driver error:', error);
      res.status(500).json({ error: 'Failed to delete driver' });
    }
  },

  async checkEmailUniqueness(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ error: 'Email parameter is required' });
      }

      const result = await driverService.checkEmailUniqueness(email);
      res.json(result);
    } catch (error) {
      console.error('Check email error:', error);
      res.status(500).json({ error: 'Failed to check email uniqueness' });
    }
  }
};