import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Never embed the service role key in a client app.
// We only use the anon public key here.

export const SUPABASE_URL = 'https://zjdzattsmzxwyikoznom.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZHphdHRzbXp4d3lpa296bm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MDY2NDAsImV4cCI6MjA3MTA4MjY0MH0.KFYoRG1pVmfQH0gg4sXDFir30RBeB7m86SSLfKFcNRU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export type Profile = {
  id: string; // This is the user_id from auth.users
  display_name: string;
  race: 'Human' | 'Demon';
  created_at: string;
  updated_at: string;
};

export type PlayerDB = {
  id: number; // This is the int8 row number
  uuid: string; // This connects to all tables
  username: string; // Same as display_name
  "Evolution Path": 'Human' | 'Demon'; // Same as race
  status: 'Active' | 'Inactive' | 'Banned' | 'Deleted';
  willpoints: number;
  evofragments: number;
  currency: number;
  profile_picture_url: string;
  "Registration Date": string;
  "Last Login": string;
};

export type PlayerData = {
  profile: Profile | null;
  playerDB: PlayerDB | null;
  isActive: boolean;
  evolutionPath: 'Human' | 'Demon' | null;
};


