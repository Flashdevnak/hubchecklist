import { Database, ShieldAlert } from 'lucide-react';
import { supabaseConfig } from '../services/supabase';

export default function SupabaseStatusNotice() {
  const Icon = supabaseConfig.isConfigured ? Database : ShieldAlert;

  return (
    <div
      className={supabaseConfig.isConfigured ? 'supabase-notice ready' : 'supabase-notice missing'}
      role="status"
    >
      <Icon size={18} />
      <span>{supabaseConfig.message}</span>
    </div>
  );
}
