import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore, NotificationFilter } from '../../stores/notificationStore';
import { Button, Badge, EmptyState } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils';
import type { AppNotification, NotificationType } from '../../types';
import './Notifications.css';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addNotification,
    getUnreadCount,
  } = useNotificationStore();

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddDummyNotification = () => {
    addNotification({
      title: 'Sample Notification: Review Architecture & Layout',
      message: 'This is a sample notification to inspect card padding, icon alignment, and action buttons.',
      type: 'reminder',
      priority: 'warning',
      link: '/notifications',
    });
    toast.success('Dummy notification added');
  };

  const unreadCount = getUnreadCount();

  const renderNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'task':
        return (
          <div className="pcc-notification-item__icon pcc-notification-item__icon--task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
        );
      case 'reminder':
        return (
          <div className="pcc-notification-item__icon pcc-notification-item__icon--reminder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        );
      case 'alarm':
        return (
          <div className="pcc-notification-item__icon pcc-notification-item__icon--alarm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2 2" />
              <path d="M5 3L2 6" />
              <path d="M22 6l-3-3" />
            </svg>
          </div>
        );
      case 'calendar':
        return (
          <div className="pcc-notification-item__icon pcc-notification-item__icon--calendar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        );
      case 'integration':
        return (
          <div className="pcc-notification-item__icon pcc-notification-item__icon--integration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
        );
      case 'system':
      default:
        return (
          <div className="pcc-notification-item__icon pcc-notification-item__icon--system">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        );
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const formatTimeAgo = (isoDate: string) => {
    try {
      const diff = Date.now() - new Date(isoDate).getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="pcc-notifications-page">
      {/* Header */}
      <header className="pcc-notifications-header">
        <div className="pcc-notifications-header__titles">
          <h1>
            Notification Center
            {unreadCount > 0 && (
              <Badge variant="accent" size="md">
                {unreadCount} Unread
              </Badge>
            )}
          </h1>
          <p>Aggregated updates from background jobs, reminders, alarms, and connected integrations.</p>
        </div>

        <div className="pcc-notifications-header__actions">
          <Button
            id="btn-add-dummy-notif"
            variant="outline"
            size="sm"
            onClick={handleAddDummyNotification}
          >
            + Add Dummy Notification
          </Button>

          {unreadCount > 0 && (
            <Button
              id="btn-mark-all-read"
              variant="secondary"
              size="sm"
              onClick={async () => {
                await markAllAsRead();
                toast.success('All notifications marked as read');
              }}
            >
              Mark all as read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              id="btn-clear-all-notifications"
              variant="ghost"
              size="sm"
              onClick={async () => {
                await clearAll();
                toast.info('Notification history cleared');
              }}
            >
              Clear all
            </Button>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="pcc-notifications-filters">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'reminder', label: 'Reminders' },
            { id: 'task', label: 'Tasks' },
            { id: 'alarm', label: 'Alarms' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'integration', label: 'Integrations' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'pcc-notifications-tab',
              filter === tab.id && 'pcc-notifications-tab--active'
            )}
            onClick={() => setFilter(tab.id as NotificationFilter)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Stream */}
      <div className="pcc-notifications-stream">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title="You're all caught up!"
            description={
              filter === 'unread'
                ? 'No unread notifications at the moment.'
                : 'No notification records match the current filter.'
            }
            actionLabel="Add Dummy Notification"
            onAction={handleAddDummyNotification}
          />
        ) : (
          filteredNotifications.map((notif: AppNotification) => (
            <div
              key={notif.id}
              id={`notif-${notif.id}`}
              className={cn(
                'pcc-notification-item',
                !notif.read && 'pcc-notification-item--unread'
              )}
            >
              <div
                className="pcc-notification-item__left"
                style={{ cursor: notif.link ? 'pointer' : 'default' }}
                onClick={() => {
                  if (!notif.read) markAsRead(notif.id);
                  if (notif.link) navigate(notif.link);
                }}
              >
                {renderNotificationIcon(notif.type)}

                <div className="pcc-notification-item__body">
                  <div className="pcc-notification-item__title-row">
                    {!notif.read && <span className="pcc-notification-item__unread-dot" />}
                    <span className="pcc-notification-item__title">{notif.title}</span>
                  </div>

                  <p className="pcc-notification-item__message">{notif.message}</p>

                  <div className="pcc-notification-item__meta">
                    <span className="pcc-notification-item__time">{formatTimeAgo(notif.createdAt)}</span>
                    <Badge variant="default" size="sm">
                      {notif.type}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pcc-notification-item__right">
                {!notif.read && (
                  <button
                    type="button"
                    className="pcc-notification-action-btn"
                    onClick={() => markAsRead(notif.id)}
                    title="Mark as read"
                    aria-label="Mark as read"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}

                <button
                  type="button"
                  className="pcc-notification-action-btn pcc-notification-action-btn--delete"
                  onClick={() => deleteNotification(notif.id)}
                  title="Dismiss notification"
                  aria-label="Dismiss notification"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
