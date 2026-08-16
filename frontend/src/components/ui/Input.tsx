import React, { InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  onClear?: () => void;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      rightElement,
      onClear,
      fullWidth = true,
      className,
      id,
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasValue = Boolean(rest.value !== undefined && rest.value !== null && String(rest.value).length > 0);

    return (
      <div
        className={cn(
          'pcc-input-wrapper',
          fullWidth && 'pcc-input-wrapper--full-width',
          disabled && 'pcc-input-wrapper--disabled',
          error && 'pcc-input-wrapper--error',
          className
        )}
      >
        {label && (
          <label htmlFor={inputId} className="pcc-input__label">
            {label}
          </label>
        )}

        <div className="pcc-input__field-container">
          {icon && <span className="pcc-input__icon-left">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              'pcc-input__field',
              Boolean(icon) && 'pcc-input__field--has-left-icon',
              Boolean(rightElement || (onClear && hasValue)) && 'pcc-input__field--has-right-element'
            )}
            {...rest}
          />
          {onClear && hasValue ? (
            <button
              type="button"
              className="pcc-input__clear-btn"
              onClick={onClear}
              aria-label="Clear input"
              title="Clear search"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : rightElement ? (
            <div className="pcc-input__element-right">{rightElement}</div>
          ) : null}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="pcc-input__message pcc-input__message--error" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="pcc-input__message pcc-input__message--helper">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
