import dotenv from 'dotenv';

// Load environment variables before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './routes/authRoutes.js';
import fleetRoutes from './routes/fleetRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import maintenanceOrderRoutes from './routes/maintenanceOrderRoutes.js';
import vehicleScheduleRoutes from './routes/vehicleScheduleRoutes.js';

// Import scheduler
import { startMaintenanceScheduler } from './cronJobs/maintenanceScheduler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend de Flotaris activo 💥');
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/maintenance-orders', maintenanceOrderRoutes);
app.use('/api/vehicle-schedules', vehicleScheduleRoutes);

// Start maintenance scheduler
startMaintenanceScheduler();

// Start server
app.listen(PORT, () => {
  console.log(`API Flotaris corriendo en puerto ${PORT}`);
});