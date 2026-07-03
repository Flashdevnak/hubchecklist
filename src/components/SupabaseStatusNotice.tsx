import { Database, ShieldAlert } from 'lucide-react';
import { supabaseConfig } from '../services/supabase';

interface SupabaseStatusNoticeProps {
  compact?: boolean;
}

export default function SupabaseStatusNotice({ compact = false }: SupabaseStatusNoticeProps) {
  const Icon = supabaseConfig.isConfigured ? Database : ShieldAlert;

  return (
    <div
      className={`${supabaseConfig.isConfigured ? 'supabase-notice ready' : 'supabase-notice missing'}${compact ? ' compact' : ''}`}
      role="status"
    >
      <Icon size={18} />
      <span>{supabaseConfig.message}</span>
    </div>
  );
}
