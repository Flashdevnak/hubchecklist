import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfigState {
  url?: string;
  anonKey?: string;
  isConfigured: boolean;
  message: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseConfig: SupabaseConfigState = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  message:
    supabaseUrl && supabaseAnonKey
      ? 'Supabase configured'
      : 'Supabase ยังไม่ได้ตั้งค่า',
};

export const supabase: SupabaseClient | null = supabaseConfig.isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
