import React, { useRef } from 'react';
import { cn } from '../../utils';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  id?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  id,
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    if (!tabs[nextIndex].disabled) {
      onChange(tabs[nextIndex].id);
      const tabElements = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabElements?.[nextIndex]?.focus();
    }
  };

  return (
    <div
      ref={tabListRef}
      id={id}
      className={cn('pcc-tabs', className)}
      role="tablist"
      aria-label="Navigation Tabs"
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            className={cn(
              'pcc-tab-button',
              isActive && 'pcc-tab-button--active',
              tab.disabled && 'pcc-tab-button--disabled'
            )}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            {tab.icon && <span className="pcc-tab-button__icon">{tab.icon}</span>}
            <span className="pcc-tab-button__label">{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn('pcc-tab-button__count', isActive && 'pcc-tab-button__count--active')}>
                {tab.count}
              </span>
            )}
            {isActive && <div className="pcc-tab-button__indicator" />}
          </button>
        );
      })}
    </div>
  );
};
