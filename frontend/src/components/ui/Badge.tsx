import React from 'react';
import { cn } from '../../utils';
import './Badge.css';

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'outline' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className,
  ...rest
}) => {
  return (
    <span
      className={cn(
        'pcc-badge',
        `pcc-badge--${variant}`,
        `pcc-badge--${size}`,
        dot && 'pcc-badge--dot-only',
        className
      )}
      {...rest}
    >
      {dot && <span className="pcc-badge__dot" />}
      {children}
    </span>
  );
};
