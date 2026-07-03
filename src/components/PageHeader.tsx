import type { PageDefinition } from '../types';

interface PageHeaderProps {
  page: PageDefinition;
}

export default function PageHeader({ page }: PageHeaderProps) {
  const Icon = page.icon;

  return (
    <header className="page-header">
      <div className="page-title-group">
        <div className="page-icon" aria-hidden="true">
          <Icon size={22} />
        </div>
        <div>
          <p className="eyebrow">Hub Vehicle Proof Capture</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </div>
    </header>
  );
}
