import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signin', authController.signIn);
router.post('/signout', authenticateToken, authController.signOut);
router.get('/session', authenticateToken, authController.getSession);

export default router;