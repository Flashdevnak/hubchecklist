import type { ReactNode } from 'react';
import { ClipboardList } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <article className="feature-card empty-state">
      <ClipboardList size={38} />
      <h2>{title}</h2>
      <p className="muted-note">{children}</p>
      {action}
    </article>
  );
}
