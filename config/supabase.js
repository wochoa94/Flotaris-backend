import { createClient } from '@supabase/supabase-js';

// Supabase client singleton
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);