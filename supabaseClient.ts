import { createClient } from '@supabase/supabase-js';

// ❗️ PASTE YOUR SUPABASE DETAILS HERE ❗️
// You can get these from your Supabase project's "API" settings.
// FIX: Explicitly type as string to avoid literal type comparison errors.
const supabaseUrl: string = 'https://nyvyesacjfyaqgtdmqts.supabase.co'; // Replace with your actual Supabase URL
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55dnllc2FjamZ5YXFndGRtcXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODAyMzIsImV4cCI6MjA3ODI1NjIzMn0.6TxMf_oDW7bUX3vIm5OWqA2r3PVgcoJ5W_iMzFSWBBY'; // Replace with your actual Supabase anon key

const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// The supabase client will be null if the details are not provided.
// The App component will display instructions if the client is null.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;