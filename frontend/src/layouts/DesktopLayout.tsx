import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { Avatar, Badge, Button, Dropdown, Modal, Input } from '../components/ui';
import { useToast } from '../hooks/useToast';
import { OnboardingModal } from '../features/onboarding/OnboardingModal';
import { DESKTOP_NAV_CATEGORIES, renderNavIcon } from './navConfig';
import { cn } from '../utils';
import './DesktopLayout.css';

import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';
import { useNoteStore } from '../stores/noteStore';

export const DesktopLayout: React.FC = () => {
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, toggleCommandPalette, theme, setTheme } = useUIStore();
  const { user } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const { toast } = useToast();

  const unreadCount = getUnreadCount();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState<'task' | 'project' | 'note'>('task');

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    try {
      if (quickType === 'task') {
        await useTaskStore.getState().addTask({ title, status: 'todo', priority: 'medium' });
      } else if (quickType === 'project') {
        await useProjectStore.getState().addProject({ title, status: 'active', category: 'General' });
      } else if (quickType === 'note') {
        await useNoteStore.getState().addNote({ title, content: '', category: 'General' });
      }
      toast.success(`Created new ${quickType}: "${title}"`);
    } catch {
      toast.error(`Failed to create ${quickType}`);
    }

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
    {
      id: 'theme',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
          <span>Theme</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 6px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            )}
          </span>
        </div>
      ) as unknown as string,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor" opacity="0.3"></path>
        </svg>
      ),
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
  ];

  return (
    <div className={cn('pcc-desktop-layout', sidebarCollapsed && 'pcc-desktop-layout--collapsed')}>
      {/* Fixed Left Sidebar */}
      <aside className="pcc-sidebar" aria-label="Main Navigation">
        {/* Logo Branding */}
        <div className="pcc-sidebar__header">
          <div className="pcc-sidebar__logo" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="PCC Logo" className="pcc-sidebar__logo-img" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="pcc-sidebar__nav">
          {DESKTOP_NAV_CATEGORIES.map((catGroup) => (
            <div key={catGroup.category} className="pcc-sidebar__section">
              {!sidebarCollapsed && (
                <div className="pcc-sidebar__category-label">{catGroup.category}</div>
              )}
              {catGroup.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  id={item.id}
                  className={({ isActive }) =>
                    cn('pcc-sidebar__nav-item', isActive && 'pcc-sidebar__nav-item--active')
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="pcc-sidebar__nav-icon">{renderNavIcon(item.iconName)}</span>
                  {!sidebarCollapsed && <span className="pcc-sidebar__nav-label">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>


        {/* User Profile & Collapse Toggle Section */}
        <div className="pcc-sidebar__footer">
          <div className="pcc-sidebar__user">
            <Dropdown
              trigger={
                <div className="pcc-sidebar__user-trigger">
                  <Avatar name={user?.name || 'User'} size="sm" status="online" />
                  {!sidebarCollapsed && (
                    <div className="pcc-sidebar__user-info">
                      <span className="pcc-sidebar__user-name">{user?.name || 'User'}</span>
                      <span className="pcc-sidebar__user-role">{user?.role || 'Admin'}</span>
                    </div>
                  )}
                </div>
              }
              items={userMenuItems}
              align="left"
            />
          </div>

          <button
            type="button"
            className="pcc-sidebar__collapse-btn"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={cn('pcc-sidebar__collapse-icon', sidebarCollapsed && 'pcc-sidebar__collapse-icon--reversed')}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pcc-desktop-main">
        {/* Top Header Bar */}
        <header className="pcc-desktop-header">
          {/* Search Trigger / Quick search */}
          <div className="pcc-desktop-header__search" onClick={toggleCommandPalette}>
            <svg className="pcc-desktop-header__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span className="pcc-desktop-header__search-placeholder">Search or jump to...</span>
            <kbd className="pcc-desktop-header__search-kbd">Ctrl K</kbd>
          </div>

          <div className="pcc-desktop-header__actions">
            {/* JSON Data Onboarding Loader Button */}
            <Button
              id="header-load-json"
              variant="outline"
              size="sm"
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              }
              onClick={() => setIsOnboardingOpen(true)}
            >
              Load Data JSON
            </Button>

            {/* Quick Add Button */}
            <Button
              id="header-quick-add"
              variant="primary"
              size="sm"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              }
              onClick={() => setIsQuickAddOpen(true)}
            >
              Quick Add
            </Button>

            {/* Notification Bell */}
            <div
              className="pcc-desktop-header__icon-btn"
              onClick={() => navigate('/notifications')}
              title="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && (
                <Badge variant="accent" size="sm" className="pcc-desktop-header__badge">
                  {unreadCount}
                </Badge>
              )}
            </div>

            {/* Avatar Dropdown */}
            <Dropdown
              trigger={<Avatar name={user?.name || 'User'} size="sm" />}
              items={userMenuItems}
              align="right"
            />
          </div>
        </header>

        {/* Page View Body */}
        <main className="pcc-desktop-content">
          <Outlet />
        </main>
      </div>

      {/* Quick Add Modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title="Quick Create"
        size="md"
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
            id="quick-add-input"
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
              Create {quickType.charAt(0).toUpperCase() + quickType.slice(1)}
            </Button>
          </div>
        </form>
      </Modal>

      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
    </div>
  );
};
