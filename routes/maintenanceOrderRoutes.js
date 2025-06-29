import express from 'express';
import { maintenanceOrderController } from '../controllers/maintenanceOrderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, maintenanceOrderController.createMaintenanceOrder);
router.put('/:id', authenticateToken, maintenanceOrderController.updateMaintenanceOrder);
router.delete('/:id', authenticateToken, maintenanceOrderController.deleteMaintenanceOrder);
router.patch('/:id/status', authenticateToken, maintenanceOrderController.updateMaintenanceOrderStatus);
router.get('/vehicle/:vehicleId', authenticateToken, maintenanceOrderController.getMaintenanceOrdersByVehicle);

export default router;