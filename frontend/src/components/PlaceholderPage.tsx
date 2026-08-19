import React from 'react';
import { Card, Button, Badge } from './ui';
import './PlaceholderPage.css';

export interface StatItem {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

export interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  category?: string;
  stats?: StatItem[];
  actions?: {
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    onClick?: () => void;
    icon?: React.ReactNode;
  }[];
  children?: React.ReactNode;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  category = 'Module',
  stats,
  actions,
  children,
}) => {
  return (
    <div className="pcc-placeholder-page">
      {/* Page Header */}
      <div className="pcc-placeholder-page__header">
        <div className="pcc-placeholder-page__header-text">
          <div className="pcc-placeholder-page__tag-row">
            <Badge variant="accent" size="sm">
              {category}
            </Badge>
            <span className="pcc-placeholder-page__status-indicator">
              <span className="pcc-placeholder-page__status-dot" /> Live Ready
            </span>
          </div>
          <h1 className="pcc-placeholder-page__title">{title}</h1>
        </div>

        {actions && actions.length > 0 && (
          <div className="pcc-placeholder-page__actions">
            {actions.map((act, idx) => (
              <Button
                key={idx}
                variant={act.variant || 'primary'}
                icon={act.icon}
                onClick={act.onClick}
              >
                {act.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      {stats && stats.length > 0 && (
        <div className="pcc-placeholder-page__stats-grid">
          {stats.map((stat, idx) => (
            <Card key={idx} hoverable padding="md" className="pcc-placeholder-stat-card">
              <span className="pcc-placeholder-stat-card__label">{stat.label}</span>
              <div className="pcc-placeholder-stat-card__value-row">
                <span className="pcc-placeholder-stat-card__value">{stat.value}</span>
                {stat.change && (
                  <Badge
                    variant={stat.positive ? 'success' : 'default'}
                    size="sm"
                  >
                    {stat.change}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="pcc-placeholder-page__content">
        {children ? (
          children
        ) : (
          <Card glass padding="lg" className="pcc-placeholder-empty-container">
            <div className="pcc-placeholder-empty-container__icon">⚡</div>
            <h3>{title} Workspace</h3>
            <p>
              This module is active and fully integrated into the PCC shell. Backend endpoints and full interactive workflows can be configured.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
