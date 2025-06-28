// index.js
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;

// Condigo de configuracion para el mensaje
app.get('/', (req, res) => {
  res.send('Backend de Flotaris activo 💥');
});

app.use(cors());
app.use(express.json());

// Supabase keys from environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.get('/vehiculos', async (req, res) => {
  const { data, error } = await supabase.from('vehiculos').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`API Flotaris corriendo en puerto ${PORT}`);
});
