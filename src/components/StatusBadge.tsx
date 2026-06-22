interface StatusBadgeProps {
  label: string;
  tone?: 'warning' | 'success' | 'neutral' | 'danger';
}

export default function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`status-badge ${tone}`}>{label}</span>;
}
