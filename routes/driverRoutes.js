import express from 'express';
import { driverController } from '../controllers/driverController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/paginated', authenticateToken, driverController.getPaginatedDrivers);
router.post('/', authenticateToken, driverController.createDriver);
router.put('/:id', authenticateToken, driverController.updateDriver);
router.delete('/:id', authenticateToken, driverController.deleteDriver);
router.get('/check-email', authenticateToken, driverController.checkEmailUniqueness);

export default router;