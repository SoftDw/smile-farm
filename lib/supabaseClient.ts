import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://cvvhegffspvaieaezghu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dmhlZ2Zmc3B2YWllYWV6Z2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4OTM2NTQsImV4cCI6MjA2ODQ2OTY1NH0.azGLxw-_vJEGdCFP08OUrrIsTMTmnJRLIksU2e8LOqI';

// Note: In a real-world application, these keys should be in environment variables.
// For this project, they are hardcoded as per the user's request.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Supabase-js uses localStorage by default, which is fine for this app.
    persistSession: true,
  }
});
