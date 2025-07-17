import { createClient } from '@supabase/supabase-js';

// Supabase client for user authentication (uses anon key)
export const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Supabase client for administrative operations (uses service role key)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Legacy export for backward compatibility (defaults to admin client)
export const supabase = supabaseAdmin;