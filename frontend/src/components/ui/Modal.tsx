import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  id?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  id,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && showCloseButton) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, showCloseButton]);

  if (!isOpen) return null;

  const hasHeader = Boolean(title || showCloseButton);

  return createPortal(
    <div
      className="pcc-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && showCloseButton) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${id || 'modal'}-title` : undefined}
    >
      <div
        ref={modalRef}
        id={id}
        className={cn('pcc-modal', `pcc-modal--${size}`)}
      >
        {hasHeader && (
          <div className="pcc-modal__header">
            {title ? (
              <h3 id={`${id || 'modal'}-title`} className="pcc-modal__title">
                {title}
              </h3>
            ) : <div />}
            {showCloseButton && (
              <button
                type="button"
                className="pcc-modal__close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="pcc-modal__body">{children}</div>

        {footer && <div className="pcc-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
