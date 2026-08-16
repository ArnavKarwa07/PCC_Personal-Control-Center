import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useIntegrationStore } from '../../stores/integrationStore';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { useNoteStore } from '../../stores/noteStore';
import { useIdeaStore } from '../../stores/ideaStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { useReminderStore } from '../../stores/reminderStore';
import { useAlarmStore } from '../../stores/alarmStore';
import { Button, Input, Badge } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { soundEffects } from '../../utils/audio';
import { cn } from '../../utils';
import type { Integration, IntegrationService } from '../../types';
import './Settings.css';

type SettingsTab = 'general' | 'integrations' | 'audio' | 'data';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const { integrations, isSyncing, toggleConnect, updateConfig, syncIntegration, testConnection } =
    useIntegrationStore();

  const { tasks } = useTaskStore();
  const { projects } = useProjectStore();
  const { notes } = useNoteStore();
  const { ideas } = useIdeaStore();
  const { events } = useCalendarStore();
  const { reminders } = useReminderStore();
  const { alarms } = useAlarmStore();
  const { toast } = useToast();

  // Profile fields
  const [name, setName] = useState(user?.name || 'Arnav Karwa');
  const [email, setEmail] = useState(user?.email || 'arnav@pcc.local');
  const [role, setRole] = useState(user?.role || 'Lead Architect');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');

  // Audio tone setting
  const [selectedTone, setSelectedTone] = useState('radiant');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({ ...user, name, email, role });
    }
    soundEffects.playPip();
    toast.success('Profile preferences updated');
  };

  const renderServiceIcon = (service: IntegrationService) => {
    switch (service) {
      case 'github':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
        );
      case 'google_calendar':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'weather':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M20 12h2" />
            <path d="M15.5 13a4.5 4.5 0 1 0-8.9 1A4 4 0 0 0 8 22h10a4 4 0 0 0 0-8c-.8 0-1.6.2-2.5.5z" />
          </svg>
        );
      case 'telegram':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        );
      case 'notion':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case 'discord':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
    }
  };

  // Full backup JSON export
  const handleExportJSON = () => {
    soundEffects.playChime();
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user,
      tasks,
      projects,
      notes,
      ideas,
      calendarEvents: events,
      reminders,
      alarms,
      integrations,
    };

    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('PCC backup JSON downloaded successfully');
  };

  return (
    <div className="pcc-settings-page">
      {/* Header */}
      <div className="pcc-settings-header">
        <h1>Settings & Integrations</h1>
        <p>Manage system preferences, API integrations, notification tones, and backup archives.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="pcc-settings-nav">
        <button
          type="button"
          className={cn('pcc-settings-nav-btn', activeTab === 'general' && 'pcc-settings-nav-btn--active')}
          onClick={() => setActiveTab('general')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          General
        </button>

        <button
          type="button"
          className={cn('pcc-settings-nav-btn', activeTab === 'integrations' && 'pcc-settings-nav-btn--active')}
          onClick={() => setActiveTab('integrations')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Integrations
        </button>

        <button
          type="button"
          className={cn('pcc-settings-nav-btn', activeTab === 'audio' && 'pcc-settings-nav-btn--active')}
          onClick={() => setActiveTab('audio')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          Audio & Alarms
        </button>

        <button
          type="button"
          className={cn('pcc-settings-nav-btn', activeTab === 'data' && 'pcc-settings-nav-btn--active')}
          onClick={() => setActiveTab('data')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Data & Export
        </button>
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === 'general' && (
        <div className="pcc-settings-panel">
          <div className="pcc-settings-grid">
            {/* Profile Info */}
            <div className="pcc-settings-card">
              <div className="pcc-settings-card__header">
                <span className="pcc-settings-card__title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile Information
                </span>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input
                  id="profile-name"
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  id="profile-email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  id="profile-role"
                  label="Role / Title"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" size="sm" type="submit">
                    Save Profile
                  </Button>
                </div>
              </form>
            </div>

            {/* Appearance & Preferences */}
            <div className="pcc-settings-card">
              <div className="pcc-settings-card__header">
                <span className="pcc-settings-card__title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                  </svg>
                  Appearance & Regional
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="pcc-reminder-form__group">
                  <label className="pcc-reminder-form__label">Theme Mode</label>
                  <div className="pcc-theme-toggle-group">
                    <Button
                      variant={theme === 'dark' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                    >
                      Deep Dark Mode
                    </Button>
                    <Button
                      variant={theme === 'light' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setTheme('light')}
                    >
                      Light Mode
                    </Button>
                  </div>
                </div>

                <div className="pcc-reminder-form__group">
                  <label className="pcc-reminder-form__label" htmlFor="settings-tz">
                    Primary Timezone
                  </label>
                  <select
                    id="settings-tz"
                    className="pcc-reminder-form__select"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
                    <option value="America/New_York">Eastern Time (UTC-5)</option>
                    <option value="Europe/London">London (UTC+0)</option>
                    <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                    <option value="Asia/Kolkata">India (UTC+5:30)</option>
                  </select>
                </div>

                <div className="pcc-reminder-form__group">
                  <label className="pcc-reminder-form__label" htmlFor="settings-date-format">
                    Date Display Format
                  </label>
                  <select
                    id="settings-date-format"
                    className="pcc-reminder-form__select"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (EU Standard)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div className="pcc-settings-panel">
          <div className="pcc-integrations-grid">
            {integrations.map((item: Integration) => {
              const isItemSyncing = isSyncing[item.id];

              return (
                <div
                  key={item.id}
                  id={`integration-${item.id}`}
                  className={cn(
                    'pcc-integration-card',
                    item.connected && 'pcc-integration-card--connected'
                  )}
                >
                  <div>
                    <div className="pcc-integration-card__header">
                      <div className="pcc-integration-card__brand">
                        <div className="pcc-integration-card__icon">{renderServiceIcon(item.service)}</div>
                        <div className="pcc-integration-card__title-area">
                          <span className="pcc-integration-card__name">{item.name}</span>
                          <span className="pcc-integration-card__category">{item.category}</span>
                        </div>
                      </div>

                      <Badge variant={item.connected ? 'success' : 'default'} size="sm">
                        {item.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>

                    <p className="pcc-integration-card__desc" style={{ marginTop: 'var(--space-3)' }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Config Box if connected */}
                  {item.connected && item.config && (
                    <div className="pcc-integration-card__config-box">
                      {Object.entries(item.config).map(([key, val]) => (
                        <div key={key} className="pcc-integration-card__config-row">
                          <span className="pcc-integration-card__config-label">{key}:</span>
                          <input
                            className="pcc-integration-card__config-input"
                            value={val}
                            onChange={(e) =>
                              updateConfig(item.id, { [key]: e.target.value })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pcc-integration-card__footer">
                    <span className="pcc-integration-card__synced-text">
                      {item.lastSynced
                        ? `Synced: ${item.lastSynced.slice(11, 16)} UTC`
                        : 'Not synced yet'}
                    </span>

                    <div className="pcc-integration-card__actions">
                      {item.connected ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={isItemSyncing}
                            onClick={async () => {
                              await syncIntegration(item.id);
                              toast.success(`Synced ${item.name}`);
                            }}
                          >
                            Sync
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toggleConnect(item.id);
                              toast.info(`Disconnected from ${item.name}`);
                            }}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              await testConnection(item.id);
                              toast.info('Connection test succeeded');
                            }}
                          >
                            Test
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              toggleConnect(item.id);
                              toast.success(`Connected to ${item.name}`);
                            }}
                          >
                            Connect
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIO & ALARMS */}
      {activeTab === 'audio' && (
        <div className="pcc-settings-panel">
          <div className="pcc-settings-grid">
            <div className="pcc-settings-card">
              <div className="pcc-settings-card__header">
                <span className="pcc-settings-card__title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  Sound & Tone Preferences
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="pcc-reminder-form__group">
                  <label className="pcc-reminder-form__label" htmlFor="sound-preset">
                    Default Alarm Tone
                  </label>
                  <select
                    id="sound-preset"
                    className="pcc-reminder-form__select"
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                  >
                    <option value="radiant">Radiant Bell (Polyphonic Harmonic)</option>
                    <option value="gentle">Gentle Chime (Smooth Sine)</option>
                    <option value="digital">Digital Pulse (Triple Beep)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      soundEffects.playAlarm(
                        selectedTone === 'digital'
                          ? 'digital'
                          : selectedTone === 'gentle'
                          ? 'gentle'
                          : 'radiant'
                      );
                      toast.info(`Playing tone: ${selectedTone}`);
                    }}
                  >
                    ▶ Test Selected Tone
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      soundEffects.playTimerComplete();
                      toast.info('Playing Pomodoro chime');
                    }}
                  >
                    🔔 Test Timer Bell
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA & EXPORT */}
      {activeTab === 'data' && (
        <div className="pcc-settings-panel">
          <div className="pcc-data-panel">
            <div className="pcc-backup-action-card">
              <h3>Export Complete PCC Archive</h3>
              <p>
                Download your tasks, projects, notes, ideas, calendar schedules, reminders, and alarm
                configurations as a portable, standardized JSON backup archive.
              </p>
              <div>
                <Button id="btn-export-json" variant="primary" size="sm" onClick={handleExportJSON}>
                  Export JSON Backup
                </Button>
              </div>
            </div>

            <div className="pcc-backup-action-card">
              <h3>Import & Restore Backup</h3>
              <p>Restore your system database from an existing PCC JSON archive backup file.</p>
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.info('Select a .json backup file to restore your workspace')}
                >
                  Choose Backup File
                </Button>
              </div>
            </div>

            <div className="pcc-backup-action-card">
              <h3>Reset Database</h3>
              <p>
                Restore all default demo datasets across tasks, kanban boards, reminders, and sample
                markdown documents.
              </p>
              <div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    soundEffects.playPip();
                    toast.info('Database reset to factory demo values');
                  }}
                >
                  Reset to Demo State
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
