import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://sudvmqudrdpfreznrvyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1ZHZtcXVkcmRwZnJlem5ydnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNTgwOTMsImV4cCI6MjEwMzczNDA5M30.MNmY3BxBFINfA0puho2ZY4mc39o-3NI2ZC3Aje5EEjo';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  key: supabaseKey
};
