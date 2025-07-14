import { maintenanceOrderService } from '../services/maintenanceOrderService.js';

export const maintenanceOrderController = {
  async getPaginatedMaintenanceOrders(req, res) {
    try {
      const {
        search = '',
        status = ['active', 'scheduled', 'pending_authorization'],
        startDate,
        endDate,
        sortBy = 'startDate',
        sortOrder = 'asc',
        page = '1',
        limit = '10'
      } = req.query;

      // Parse query parameters
      const filters = {
        search: search.trim(),
        status: Array.isArray(status) ? status : (status ? [status] : []),
        startDate: startDate || null,
        endDate: endDate || null,
        sortBy,
        sortOrder: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
        page: Math.max(1, parseInt(page, 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10))
      };

      const result = await maintenanceOrderService.getPaginatedMaintenanceOrders(filters);
      res.json(result);
    } catch (error) {
      console.error('Get paginated maintenance orders error:', error);
      res.status(500).json({ error: 'Failed to fetch paginated maintenance orders' });
    }
  },

  async createMaintenanceOrder(req, res) {
    try {
      const order = await maintenanceOrderService.createMaintenanceOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      console.error('Add maintenance order error:', error);
      
      // Handle business logic errors with 409 Conflict status
      if (error.message.includes('already has a maintenance order') || 
          error.message.includes('scheduled for a trip') ||
          error.message.includes('Start date must be before end date') ||
          error.message.includes('Start date cannot be in the past')) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to add maintenance order' });
    }
  },

  async updateMaintenanceOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await maintenanceOrderService.updateMaintenanceOrder(id, req.body);
      res.json(order);
    } catch (error) {
      console.error('Update maintenance order error:', error);
      
      if (error.message === 'Maintenance order not found') {
        return res.status(404).json({ error: error.message });
      }
      
      // Handle business logic errors with 409 Conflict status
      if (error.message.includes('already has a maintenance order') || 
          error.message.includes('scheduled for a trip') ||
          error.message.includes('Start date must be before end date') ||
          error.message.includes('Start date cannot be in the past')) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to update maintenance order' });
    }
  },

  async deleteMaintenanceOrder(req, res) {
    try {
      const { id } = req.params;
      await maintenanceOrderService.deleteMaintenanceOrder(id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete maintenance order error:', error);
      res.status(500).json({ error: 'Failed to delete maintenance order' });
    }
  },

  async updateMaintenanceOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const order = await maintenanceOrderService.updateMaintenanceOrderStatus(id, req.body);
      res.json(order);
    } catch (error) {
      console.error('Update maintenance order status error:', error);
      
      // Handle specific PostgreSQL RPC errors
      if (error.message === 'Maintenance order not found' || 
          error.message === 'Associated vehicle not found') {
        return res.status(404).json({ error: error.message });
      }
      
      // Handle business logic validation errors
      if (error.message.includes('Invalid status transition') ||
          error.message.includes('Cannot change status of a') ||
          error.message.includes('Cost and quotation details are required') ||
          error.message.includes('Maintenance order must transition to')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to update maintenance order status' });
    }
  },

  async getMaintenanceOrdersByVehicle(req, res) {
    try {
      const { vehicleId } = req.params;
      const { status } = req.query;

      const statuses = status ? (Array.isArray(status) ? status : [status]) : [];
      const orders = await maintenanceOrderService.getMaintenanceOrdersByVehicle(vehicleId, statuses);
      
      res.json(orders);
    } catch (error) {
      console.error('Get maintenance orders by vehicle error:', error);
      res.status(500).json({ error: 'Failed to fetch maintenance orders' });
    }
  },

  async getMaintenanceOrderSummary(req, res) {
    try {
      const summary = await maintenanceOrderService.getMaintenanceOrderSummary();
      res.json(summary);
    } catch (error) {
      console.error('Get maintenance order summary error:', error);
      res.status(500).json({ error: 'Failed to fetch maintenance order summary' });
    }
  }
};