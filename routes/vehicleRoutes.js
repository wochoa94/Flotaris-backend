import express from 'express';
import { vehicleController } from '../controllers/vehicleController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, vehicleController.getAllVehicles);
router.post('/', authenticateToken, vehicleController.createVehicle);
router.put('/:id', authenticateToken, vehicleController.updateVehicle);
router.delete('/:id', authenticateToken, vehicleController.deleteVehicle);
router.get('/:id', authenticateToken, vehicleController.getVehicleById);
router.patch('/:id/status', authenticateToken, vehicleController.updateVehicleStatus);

export default router;