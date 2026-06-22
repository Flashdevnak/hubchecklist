import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function PrimaryButton({ children, variant = 'primary', ...props }: PrimaryButtonProps) {
  return (
    <button className={`primary-button ${variant}`} type="button" {...props}>
      {children}
    </button>
  );
}
