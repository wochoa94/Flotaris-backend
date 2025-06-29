import express from 'express';
import { fleetController } from '../controllers/fleetController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, fleetController.getFleetData);

export default router;