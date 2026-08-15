import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { Avatar, Badge, Dropdown, Modal, Input, Button } from '../components/ui';
import { useToast } from '../hooks/useToast';
import { MOBILE_NAV_ITEMS, renderNavIcon } from './navConfig';
import { cn } from '../utils';
import './MobileLayout.css';

export const MobileLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const { toast } = useToast();

  const unreadCount = getUnreadCount();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState<'task' | 'project' | 'note'>('task');

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    toast.success(`Created new ${quickType}: "${quickTitle}"`);
    setQuickTitle('');
    setIsQuickAddOpen(false);
  };

  const userMenuItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      onClick: () => navigate('/settings'),
    },
    { id: 'div-1', label: '', divider: true },
    {
      id: 'logout',
      label: 'Sign Out',
      danger: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      ),
      onClick: () => {
        logout();
        toast.info('Signed out successfully');
        navigate('/login');
      },
    },
  ];

  return (
    <div className="pcc-mobile-layout">
      {/* Mobile Top Header */}
      <header className="pcc-mobile-header">
        <div className="pcc-mobile-header__brand" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="PCC Logo" className="pcc-mobile-header__logo-img" style={{ width: 26, height: 26, borderRadius: 5, objectFit: 'contain' }} />
          <span className="pcc-mobile-header__title">PCC</span>
        </div>

        <div className="pcc-mobile-header__actions">
          <div
            className="pcc-mobile-header__icon-btn"
            onClick={() => navigate('/notifications')}
            title="Notifications"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <Badge variant="accent" size="sm" className="pcc-mobile-header__badge">
                {unreadCount}
              </Badge>
            )}
          </div>

          <Dropdown
            trigger={<Avatar name={user?.name || 'User'} size="sm" />}
            items={userMenuItems}
            align="right"
          />
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="pcc-mobile-content">
        <Outlet />
      </main>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        id="mobile-fab-quick-add"
        className="pcc-mobile-fab"
        onClick={() => setIsQuickAddOpen(true)}
        aria-label="Quick Add"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Fixed Bottom Navigation */}
      <nav className="pcc-mobile-nav" aria-label="Mobile Navigation">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            id={item.id}
            className={({ isActive }) =>
              cn('pcc-mobile-nav__item', isActive && 'pcc-mobile-nav__item--active')
            }
          >
            <span className="pcc-mobile-nav__icon">{renderNavIcon(item.iconName)}</span>
            <span className="pcc-mobile-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Quick Add Modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title="Quick Create"
        size="sm"
      >
        <form onSubmit={handleQuickAddSubmit} className="pcc-quick-add-form">
          <div className="pcc-quick-add-form__types">
            {(['task', 'project', 'note'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={cn(
                  'pcc-quick-add-form__type-pill',
                  quickType === type && 'pcc-quick-add-form__type-pill--active'
                )}
                onClick={() => setQuickType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <Input
            id="mobile-quick-add-input"
            label="Title"
            placeholder={`What ${quickType} are you working on?`}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            autoFocus
          />

          <div className="pcc-quick-add-form__footer">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
