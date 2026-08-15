import React from 'react';
import { cn } from '../../utils';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  header,
  footer,
  hoverable = false,
  glass = true,
  padding = 'md',
  children,
  className,
  ...rest
}) => {
  return (
    <div
      className={cn(
        'pcc-card',
        glass && 'pcc-card--glass',
        hoverable && 'pcc-card--hoverable',
        `pcc-card--padding-${padding}`,
        className
      )}
      {...rest}
    >
      {header && <div className="pcc-card__header">{header}</div>}
      <div className="pcc-card__body">{children}</div>
      {footer && <div className="pcc-card__footer">{footer}</div>}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...rest
}) => (
  <div className={cn('pcc-card__header', className)} {...rest}>
    {children}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...rest
}) => (
  <div className={cn('pcc-card__body', className)} {...rest}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...rest
}) => (
  <div className={cn('pcc-card__footer', className)} {...rest}>
    {children}
  </div>
);
