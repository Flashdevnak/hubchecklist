import StatusBadge from './StatusBadge';

interface MobileStatCardProps {
  label: string;
  value: string | number;
  tone?: 'warning' | 'success' | 'neutral' | 'danger';
}

export default function MobileStatCard({ label, value, tone = 'neutral' }: MobileStatCardProps) {
  return (
    <article className="mobile-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <StatusBadge label={tone} tone={tone} />
    </article>
  );
}
