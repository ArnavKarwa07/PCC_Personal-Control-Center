import React from 'react';
import { cn } from '../../utils';
import './Spinner.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  id,
  color,
}) => {
  return (
    <div
      id={id}
      className={cn('pcc-spinner', `pcc-spinner--${size}`, className)}
      style={color ? { borderTopColor: color } : undefined}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
