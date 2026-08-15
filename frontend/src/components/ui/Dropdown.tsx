import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils';
import './Dropdown.css';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  id?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    const selectableItems = items.filter((item) => !item.divider && !item.disabled);

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % selectableItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + selectableItems.length) % selectableItems.length);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const target = selectableItems[highlightedIndex];
      if (target?.onClick) {
        target.onClick();
      }
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      id={id}
      className={cn('pcc-dropdown', className)}
      onKeyDown={handleKeyDown}
    >
      <div
        className="pcc-dropdown__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={cn('pcc-dropdown__menu', `pcc-dropdown__menu--align-${align}`)}
          role="menu"
        >
          {items.map((item) => {
            if (item.divider) {
              return <div key={item.id} className="pcc-dropdown__divider" role="separator" />;
            }

            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={cn(
                  'pcc-dropdown__item',
                  item.danger && 'pcc-dropdown__item--danger',
                  item.disabled && 'pcc-dropdown__item--disabled'
                )}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setIsOpen(false);
                  }
                }}
              >
                {item.icon && <span className="pcc-dropdown__item-icon">{item.icon}</span>}
                <span className="pcc-dropdown__item-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
