// ============================================================
// Supabase Client (Frontend)
// Direct Supabase client for auth and realtime subscriptions
// ============================================================

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://djoxjgpamozudqvrpvgy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb3hqZ3BhbW96dWRxdnJwdmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDI5MjEsImV4cCI6MjA5MTUxODkyMX0.LWoi5NZ42wNCWf3syzF2d1FSqJQp0Hn75582-V87QM4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
