import express from 'express';
import { vehicleScheduleController } from '../controllers/vehicleScheduleController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/paginated', authenticateToken, vehicleScheduleController.getPaginatedVehicleSchedules);
router.post('/', authenticateToken, vehicleScheduleController.createVehicleSchedule);
router.put('/:id', authenticateToken, vehicleScheduleController.updateVehicleSchedule);
router.delete('/:id', authenticateToken, vehicleScheduleController.deleteVehicleSchedule);
router.patch('/:id/status', authenticateToken, vehicleScheduleController.updateVehicleScheduleStatus);
router.get('/vehicle/:vehicleId/active', authenticateToken, vehicleScheduleController.getActiveSchedulesForVehicle);
router.get('/vehicle/:vehicleId/other', authenticateToken, vehicleScheduleController.getOtherSchedulesForVehicle);

export default router;