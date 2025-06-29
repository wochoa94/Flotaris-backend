import { maintenanceOrderService } from '../services/maintenanceOrderService.js';

export const maintenanceOrderController = {
  async createMaintenanceOrder(req, res) {
    try {
      const order = await maintenanceOrderService.createMaintenanceOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      console.error('Add maintenance order error:', error);
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
      if (error.message === 'Maintenance order not found') {
        return res.status(404).json({ error: error.message });
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
  }
};