import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export default function SectionCard({ title, children, aside, className = '' }: SectionCardProps) {
  return (
    <article className={`feature-card section-card ${className}`.trim()}>
      <div className="section-card-header">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </article>
  );
}
