// index.js
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Token verification failed' });
  }
};

// Create API router
const apiRouter = express.Router();

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend de Flotaris activo 💥');
});

// Authentication endpoints
apiRouter.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.post('/auth/signout', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiRouter.get('/auth/session', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fleet data endpoint
apiRouter.get('/fleet', authenticateToken, async (req, res) => {
  try {
    const [vehiclesResult, driversResult, maintenanceOrdersResult, vehicleSchedulesResult] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('drivers').select('*'),
      supabase.from('maintenance_orders').select('*'),
      supabase.from('vehicle_schedules').select('*')
    ]);

    if (vehiclesResult.error) throw vehiclesResult.error;
    if (driversResult.error) throw driversResult.error;
    if (maintenanceOrdersResult.error) throw maintenanceOrdersResult.error;
    if (vehicleSchedulesResult.error) throw vehicleSchedulesResult.error;

    res.json({
      vehicles: vehiclesResult.data || [],
      drivers: driversResult.data || [],
      maintenance_orders: maintenanceOrdersResult.data || [],
      vehicle_schedules: vehicleSchedulesResult.data || []
    });
  } catch (error) {
    console.error('Fleet data error:', error);
    res.status(500).json({ error: 'Failed to fetch fleet data' });
  }
});

// Driver endpoints
apiRouter.post('/drivers', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Add driver error:', error);
    res.status(500).json({ error: 'Failed to add driver' });
  }
});

apiRouter.put('/drivers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('drivers')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

apiRouter.delete('/drivers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

apiRouter.get('/drivers/check-email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const { data, error } = await supabase
      .from('drivers')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (error) throw error;

    res.json({ isUnique: data.length === 0 });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Failed to check email uniqueness' });
  }
});

// Vehicle endpoints
apiRouter.get('/vehicles', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

apiRouter.post('/vehicles', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

apiRouter.put('/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('vehicles')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

apiRouter.delete('/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

apiRouter.get('/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

apiRouter.patch('/vehicles/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};
    
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.driver_id !== undefined) updateData.driver_id = req.body.driver_id;

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update vehicle status error:', error);
    res.status(500).json({ error: 'Failed to update vehicle status' });
  }
});

// Maintenance order endpoints
apiRouter.post('/maintenance-orders', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Add maintenance order error:', error);
    res.status(500).json({ error: 'Failed to add maintenance order' });
  }
});

apiRouter.put('/maintenance-orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('maintenance_orders')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Maintenance order not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update maintenance order error:', error);
    res.status(500).json({ error: 'Failed to update maintenance order' });
  }
});

apiRouter.delete('/maintenance-orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('maintenance_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Delete maintenance order error:', error);
    res.status(500).json({ error: 'Failed to delete maintenance order' });
  }
});

apiRouter.patch('/maintenance-orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('maintenance_orders')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Maintenance order not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update maintenance order status error:', error);
    res.status(500).json({ error: 'Failed to update maintenance order status' });
  }
});

apiRouter.get('/maintenance-orders/vehicle/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('maintenance_orders')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query = query.in('status', statuses);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get maintenance orders by vehicle error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance orders' });
  }
});

// Vehicle schedule endpoints
apiRouter.post('/vehicle-schedules', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Add vehicle schedule error:', error);
    res.status(500).json({ error: 'Failed to add vehicle schedule' });
  }
});

apiRouter.put('/vehicle-schedules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('vehicle_schedules')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle schedule not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update vehicle schedule error:', error);
    res.status(500).json({ error: 'Failed to update vehicle schedule' });
  }
});

apiRouter.delete('/vehicle-schedules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('vehicle_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Delete vehicle schedule error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle schedule' });
  }
});

apiRouter.patch('/vehicle-schedules/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('vehicle_schedules')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle schedule not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update vehicle schedule status error:', error);
    res.status(500).json({ error: 'Failed to update vehicle schedule status' });
  }
});

apiRouter.get('/vehicle-schedules/vehicle/:vehicleId/active', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const { data, error } = await supabase
      .from('vehicle_schedules')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active');

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get active vehicle schedules error:', error);
    res.status(500).json({ error: 'Failed to fetch active vehicle schedules' });
  }
});

apiRouter.get('/vehicle-schedules/vehicle/:vehicleId/other', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { exclude, status } = req.query;

    let query = supabase
      .from('vehicle_schedules')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (exclude) {
      query = query.neq('id', exclude);
    }

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query = query.in('status', statuses);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get other vehicle schedules error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle schedules' });
  }
});

// Mount API router
app.use('/api', apiRouter);

// Start server
app.listen(PORT, () => {
  console.log(`API Flotaris corriendo en puerto ${PORT}`);
});