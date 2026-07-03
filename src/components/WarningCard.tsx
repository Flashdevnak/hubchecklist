import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface WarningCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  tone?: 'warning' | 'danger' | 'neutral';
}

export default function WarningCard({ title, children, action, tone = 'warning' }: WarningCardProps) {
  return (
    <article className={`warning-card ${tone}`}>
      <AlertTriangle size={22} />
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
        {action ? <div className="warning-card-action">{action}</div> : null}
      </div>
    </article>
  );
}
