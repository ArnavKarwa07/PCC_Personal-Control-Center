import React, { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';
import { cn } from '../../utils';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      disabled = false,
      icon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      id,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        id={id}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          'pcc-button',
          `pcc-button--${variant}`,
          `pcc-button--${size}`,
          fullWidth && 'pcc-button--full-width',
          loading && 'pcc-button--loading',
          className
        )}
        {...rest}
      >
        {loading ? (
          <Spinner
            size={size === 'lg' ? 'md' : 'sm'}
            color="currentColor"
            className="pcc-button__spinner"
          />
        ) : (
          <>
            {icon && <span className="pcc-button__icon-left">{icon}</span>}
            {children && <span className="pcc-button__content">{children}</span>}
            {rightIcon && <span className="pcc-button__icon-right">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
