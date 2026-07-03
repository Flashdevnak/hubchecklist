import { HardDrive, WifiOff } from 'lucide-react';

interface StorageModeBadgeProps {
  label: string;
  mode: 'local' | 'cloud';
}

export default function StorageModeBadge({ label, mode }: StorageModeBadgeProps) {
  const Icon = mode === 'local' ? WifiOff : HardDrive;
  return (
    <span className={`storage-mode-badge ${mode}`}>
      <Icon size={15} />
      <span>{label}</span>
    </span>
  );
}
