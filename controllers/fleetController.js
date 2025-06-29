import { fleetService } from '../services/fleetService.js';

export const fleetController = {
  async getFleetData(req, res) {
    try {
      const fleetData = await fleetService.getAllFleetData();
      res.json(fleetData);
    } catch (error) {
      console.error('Fleet data error:', error);
      res.status(500).json({ error: 'Failed to fetch fleet data' });
    }
  }
};