import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client (service role) – NEVER expose this key on the client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string; // Can reuse same URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables for service client');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
