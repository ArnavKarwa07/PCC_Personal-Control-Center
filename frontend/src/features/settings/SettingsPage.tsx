import React, { useState, useEffect } from 'react';
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
import { Button, Input, Badge, Modal } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { soundEffects } from '../../utils/audio';
import { cn } from '../../utils';
import { integrationsApi, getApiBaseUrl, setApiBaseUrl, DEFAULT_CLOUD_API_URL } from '../../services/api';
import { permissionService, SystemPermissionStatus } from '../../services/permissionService';
import { validateAndCleanImportData, executeDataImport } from '../../services/jsonImportService';
import type { Integration, IntegrationService, AccentColor } from '../../types';
import './Settings.css';

type SettingsTab = 'general' | 'integrations' | 'audio' | 'data';

const ACCENT_OPTIONS: { id: AccentColor; label: string; gradient: string }[] = [
  { id: 'indigo', label: 'Indigo', gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
  { id: 'emerald', label: 'Emerald', gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' },
  { id: 'violet', label: 'Violet', gradient: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)' },
  { id: 'amber', label: 'Amber', gradient: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)' },
];

const BASE_INTEGRATION_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'password' }[]> = {
  github: [
    { key: 'token', label: 'Personal Access Token', type: 'password' },
    { key: 'repositories', label: 'Repositories (comma-separated)', type: 'text' },
  ],
  google_calendar: [
    { key: 'account', label: 'Google Account', type: 'text' },
    { key: 'calendars', label: 'Calendars', type: 'text' },
  ],
  teams_calendar: [
    { key: 'tenantId', label: 'Tenant ID', type: 'text' },
    { key: 'clientId', label: 'Client ID', type: 'text' },
    { key: 'calendarId', label: 'Calendar ID', type: 'text' },
  ],
  telegram: [
    { key: 'botToken', label: 'Bot Token', type: 'password' },
    { key: 'chatId', label: 'Chat ID', type: 'text' },
  ],
  slack: [
    { key: 'userToken', label: 'User Token', type: 'password' },
    { key: 'defaultChannel', label: 'Default Channel', type: 'text' },
  ],
  gitlab: [
    { key: 'token', label: 'Personal Access Token', type: 'password' },
    { key: 'gitlabUrl', label: 'GitLab URL', type: 'text' },
    { key: 'projectIds', label: 'Project IDs', type: 'text' },
  ],
  jira: [
    { key: 'domain', label: 'Domain (e.g. company.atlassian.net)', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'apiToken', label: 'API Token', type: 'password' },
    { key: 'projectKey', label: 'Project Key', type: 'text' },
  ],
  notion: [
    { key: 'integrationToken', label: 'Integration Token', type: 'password' },
    { key: 'workspaceId', label: 'Workspace ID', type: 'text' },
  ],
  discord: [
    { key: 'webhookUrl', label: 'Webhook URL', type: 'text' },
  ],
};

const INTEGRATION_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'password' }[]> = {
  ...BASE_INTEGRATION_FIELDS,
  'int-github': BASE_INTEGRATION_FIELDS.github,
  'int-gcal': BASE_INTEGRATION_FIELDS.google_calendar,
  'int-teams-calendar': BASE_INTEGRATION_FIELDS.teams_calendar,
  'int-telegram': BASE_INTEGRATION_FIELDS.telegram,
  'int-slack': BASE_INTEGRATION_FIELDS.slack,
  'int-gitlab': BASE_INTEGRATION_FIELDS.gitlab,
  'int-jira': BASE_INTEGRATION_FIELDS.jira,
  'int-notion': BASE_INTEGRATION_FIELDS.notion,
  'int-discord': BASE_INTEGRATION_FIELDS.discord,
};

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [openSection, setOpenSection] = useState<string | null>('general');

  const { user, setUser } = useAuthStore();
  const { theme, setTheme, accentColor, setAccentColor } = useUIStore();
  const { integrations, isSyncing, toggleConnect, updateConfig, syncIntegration, testConnection, fetchIntegrations } =
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

  // 24/7 Cloud Backend & Server Sync State
  const [serverUrlInput, setServerUrlInput] = useState(getApiBaseUrl());
  const [isTestingServer, setIsTestingServer] = useState(false);

  // System Permissions State
  const [permissionStatus, setPermissionStatus] = useState<SystemPermissionStatus>({
    notifications: 'prompt',
    location: 'prompt',
  });

  useEffect(() => {
    permissionService.checkPermissions().then(setPermissionStatus);
  }, []);

  const handleSaveServerUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setApiBaseUrl(serverUrlInput);
    soundEffects.playPip();
    toast.success('Backend Server URL saved');
  };

  const handleTestServerUrl = async () => {
    setIsTestingServer(true);
    try {
      const targetUrl = serverUrlInput.trim().replace(/\/+$/, '');
      const res = await fetch(`${targetUrl}/api/v1/health`);
      if (res.ok) {
        soundEffects.playChime();
        toast.success('Connected to 24/7 Cloud Backend successfully!');
      } else {
        toast.error(`Health check returned status ${res.status}`);
      }
    } catch (err: any) {
      toast.error(`Connection failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleGrantPermissions = async () => {
    const updated = await permissionService.requestAllPermissions();
    setPermissionStatus(updated);
    if (updated.notifications === 'granted' && updated.location === 'granted') {
      soundEffects.playChime();
      toast.success('All system permissions granted successfully!');
    } else {
      toast.info('Permissions updated');
    }
  };

  // Audio tone setting
  const [selectedTone, setSelectedTone] = useState('radiant');

  // Integration connect modal state
  const [connectModal, setConnectModal] = useState<{ provider: string; name: string; id?: string } | null>(null);
  const [connectConfig, setConnectConfig] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleConnectIntegration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!connectModal) return;

    setIsConnecting(true);
    setConnectError(null);
    try {
      await integrationsApi.connect(connectModal.provider, connectConfig);
      await fetchIntegrations();
      soundEffects.playChime();
      toast.success(`Connected to ${connectModal.name}`);
      setConnectModal(null);
      setConnectConfig({});
    } catch (err: any) {
      const message = err?.message || `Failed to connect to ${connectModal.name}`;
      setConnectError(message);
      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({ ...user, name, email, role });
    }
    soundEffects.playPip();
    toast.success('Profile preferences updated');
  };

  const renderServiceIcon = (service: IntegrationService) => {
    return (
      <img
        src={`/logos/${service}.svg`}
        alt={`${service} logo`}
        className="pcc-integration-card__logo-img"
        aria-hidden="true"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  };

  // Full backup JSON export
  const handleExportJSON = () => {
    soundEffects.playChime();
    const sanitizedIntegrations = (integrations || []).map((i: any) => {
      const copy = { ...i };
      if (copy.config) {
        const safeConfig: Record<string, string> = {};
        for (const [k, v] of Object.entries(copy.config)) {
          if (/token|secret|password|key|url|webhook|cred|auth/i.test(k)) {
            safeConfig[k] = '***REDACTED***';
          } else {
            safeConfig[k] = v as string;
          }
        }
        copy.config = safeConfig;
      }
      return copy;
    });

    const backupData = {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      user,
      tasks,
      projects,
      notes,
      ideas,
      calendarEvents: events,
      reminders,
      alarms,
      integrations: sanitizedIntegrations,
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

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = (event.target?.result as string) || '';
        const result = validateAndCleanImportData(text);
        if (!result.success) {
          const firstErr = result.issues.find((i) => i.level === 'error')?.message || 'Invalid backup JSON file schema.';
          toast.error(firstErr);
          return;
        }

        executeDataImport(result.payload);
        soundEffects.playChime();
        const s = result.stats;
        toast.success(
          `Imported ${s.tasks} tasks, ${s.projects} projects, ${s.notes} notes, ${s.ideas} ideas, ${s.calendarEvents} events, ${s.reminders} reminders, ${s.integrations} integrations successfully with 0 errors!`
        );
        setTimeout(() => window.location.reload(), 600);
      } catch (err: any) {
        toast.error(`Failed to restore backup: ${err?.message || 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const renderGeneralContent = (idPrefix = '') => (
    <div className="pcc-settings-grid">
      {/* 24/7 Cloud Connection & Cross-Device Sync */}
      <div className="pcc-settings-card">
        <div className="pcc-settings-card__header">
          <span className="pcc-settings-card__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
            24/7 Cloud Connection & Sync
          </span>
        </div>

        <form onSubmit={handleSaveServerUrl} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            id={`${idPrefix}server-url`}
            label="Backend Server API URL"
            value={serverUrlInput}
            onChange={(e) => setServerUrlInput(e.target.value)}
            placeholder={DEFAULT_CLOUD_API_URL}
          />
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
            Default 24/7 Cloud URL: <code style={{ fontSize: '0.75rem' }}>{DEFAULT_CLOUD_API_URL}</code>. For local network sync on phone, use your host IP (e.g. <code style={{ fontSize: '0.75rem' }}>http://192.168.x.x:8000</code>).
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              loading={isTestingServer}
              onClick={handleTestServerUrl}
            >
              Test Connection
            </Button>

            <Button variant="primary" size="sm" type="submit">
              Save Server URL
            </Button>
          </div>
        </form>
      </div>

      {/* Profile Info */}
      <div className="pcc-settings-card">
        <div className="pcc-settings-card__header">
          <span className="pcc-settings-card__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile Information
          </span>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            id={`${idPrefix}profile-name`}
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            id={`${idPrefix}profile-email`}
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id={`${idPrefix}profile-role`}
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
            </svg>
            Appearance & Regional
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="pcc-reminder-form__group">
            <label className="pcc-reminder-form__label">Theme Mode</label>
            <div
              className={cn('pcc-theme-switch', theme === 'dark' ? 'pcc-theme-switch--dark' : 'pcc-theme-switch--light')}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Toggle dark or light theme mode"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                }
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              <div className="pcc-theme-switch__option pcc-theme-switch__option--light">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span>Light</span>
              </div>

              <div className="pcc-theme-switch__option pcc-theme-switch__option--dark">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span>Dark</span>
              </div>

              <div className="pcc-theme-switch__knob" />
            </div>
          </div>

          <div className="pcc-reminder-form__group">
            <label className="pcc-reminder-form__label">Accent Color Palette</label>
            <div className="pcc-accent-swatches">
              {ACCENT_OPTIONS.map((opt) => {
                const isSelected = accentColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={cn('pcc-accent-swatch', isSelected && 'pcc-accent-swatch--active')}
                    onClick={() => {
                      setAccentColor(opt.id);
                      soundEffects.playPip();
                      toast.success(`Accent color set to ${opt.label}`);
                    }}
                    title={`Select ${opt.label} accent color`}
                    aria-label={`Select ${opt.label} accent color`}
                  >
                    <span
                      className="pcc-accent-swatch__preview"
                      style={{ background: opt.gradient }}
                    />
                    <span className="pcc-accent-swatch__label">{opt.label}</span>
                    {isSelected && (
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        aria-hidden="true"
                        className="pcc-accent-swatch__check"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pcc-settings-field-row">
            <label className="pcc-reminder-form__label pcc-settings-field-label" htmlFor={`${idPrefix}settings-tz`}>
              Primary Timezone
            </label>
            <select
              id={`${idPrefix}settings-tz`}
              className="pcc-reminder-form__select pcc-settings-select"
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

          <div className="pcc-settings-field-row">
            <label className="pcc-reminder-form__label pcc-settings-field-label" htmlFor={`${idPrefix}settings-date-format`}>
              Date Display Format
            </label>
            <select
              id={`${idPrefix}settings-date-format`}
              className="pcc-reminder-form__select pcc-settings-select"
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
  );

  const renderIntegrationsContent = (idPrefix = '') => (
    <div className="pcc-integrations-grid">
      {integrations.map((item: Integration) => {
        const isItemSyncing = isSyncing[item.id];

        return (
          <div
            key={item.id}
            id={`integration-${idPrefix}${item.id}`}
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
                      aria-label={`${item.name} ${key}`}
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
                        const provider = (item as any).provider || item.service;
                        setConnectModal({
                          provider,
                          name: item.name,
                          id: item.id,
                        });
                        setConnectConfig({});
                        setConnectError(null);
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
  );

  const renderAudioContent = (idPrefix = '') => (
    <div className="pcc-settings-grid">
      {/* System Permissions Status Card */}
      <div className="pcc-settings-card">
        <div className="pcc-settings-card__header">
          <span className="pcc-settings-card__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            System Permissions Status
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>OS Local Notifications</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Required for alarms, reminders, and timers to trigger when app is closed.
              </div>
            </div>
            <Badge variant={permissionStatus.notifications === 'granted' ? 'success' : 'warning'}>
              {permissionStatus.notifications.toUpperCase()}
            </Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>GPS & Device Location</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Required for live local weather telemetry updates.
              </div>
            </div>
            <Badge variant={permissionStatus.location === 'granted' ? 'success' : 'warning'}>
              {permissionStatus.location.toUpperCase()}
            </Badge>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <Button variant="primary" size="sm" onClick={handleGrantPermissions}>
              🔔 Grant All System Permissions
            </Button>
          </div>
        </div>
      </div>

      <div className="pcc-settings-card">
        <div className="pcc-settings-card__header">
          <span className="pcc-settings-card__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            Sound & Tone Preferences
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="pcc-reminder-form__group">
            <label className="pcc-reminder-form__label" htmlFor={`${idPrefix}sound-preset`}>
              Default Alarm Tone
            </label>
            <select
              id={`${idPrefix}sound-preset`}
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
  );

  const renderDataContent = (idPrefix = '') => (
    <div className="pcc-data-panel">
      <div className="pcc-backup-action-card">
        <h3>Export Complete PCC Archive</h3>
        <p>
          Download your tasks, projects, notes, ideas, calendar schedules, reminders, and alarm
          configurations as a portable, standardized JSON backup archive.
        </p>
        <div>
          <Button id={`${idPrefix}btn-export-json`} variant="primary" size="sm" onClick={handleExportJSON}>
            Export JSON Backup
          </Button>
        </div>
      </div>

      <div className="pcc-backup-action-card">
        <h3>Import & Restore Backup</h3>
        <p>Restore your system database from an existing PCC JSON archive backup file.</p>
        <div>
          <label className="pcc-upload-btn" style={{ cursor: 'pointer' }}>
            📂 Choose Backup File
            <input
              type="file"
              accept=".json"
              aria-label="Upload Backup JSON File"
              onChange={handleImportJSONFile}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pcc-settings-page">
      {/* Header */}
      <div className="pcc-settings-header">
        <h1>Settings</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="pcc-settings-nav">
        <button
          type="button"
          className={cn('pcc-settings-nav-btn', activeTab === 'general' && 'pcc-settings-nav-btn--active')}
          onClick={() => setActiveTab('general')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="1" x2="12" y2="3" />
          </svg>
          Data & Export
        </button>
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === 'general' && (
        <div className="pcc-settings-panel">
          {renderGeneralContent()}
        </div>
      )}

      {/* TAB 2: INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div className="pcc-settings-panel">
          {renderIntegrationsContent()}
        </div>
      )}

      {/* TAB 3: AUDIO & ALARMS */}
      {activeTab === 'audio' && (
        <div className="pcc-settings-panel">
          {renderAudioContent()}
        </div>
      )}

      {/* TAB 4: DATA & EXPORT */}
      {activeTab === 'data' && (
        <div className="pcc-settings-panel">
          {renderDataContent()}
        </div>
      )}

      {/* Mobile View: 4 Single-Open Expandable Accordion Sections */}
      <div className="pcc-settings-mobile-container">
        {[
          {
            id: 'general',
            num: '1',
            title: 'General',
            content: () => renderGeneralContent('m-'),
          },
          {
            id: 'integrations',
            num: '2',
            title: 'Integrations',
            content: () => renderIntegrationsContent('m-'),
          },
          {
            id: 'audio',
            num: '3',
            title: 'Audio & Alarms',
            content: () => renderAudioContent('m-'),
          },
          {
            id: 'data',
            num: '4',
            title: 'Data & Export',
            content: () => renderDataContent('m-'),
          },
        ].map((sec) => {
          const isOpen = openSection === sec.id;
          return (
            <div
              key={sec.id}
              className={cn(
                'pcc-settings-accordion-card',
                isOpen && 'pcc-settings-accordion-card--open'
              )}
            >
              <button
                type="button"
                id={`pcc-accordion-header-${sec.id}`}
                className="pcc-settings-accordion-trigger"
                onClick={() => setOpenSection(isOpen ? null : sec.id)}
                aria-expanded={isOpen}
                aria-controls={`pcc-accordion-content-${sec.id}`}
              >
                <div className="pcc-settings-accordion-trigger__left">
                  <span className="pcc-settings-accordion-trigger__badge">{sec.num}</span>
                  <span className="pcc-settings-accordion-trigger__title">{sec.title}</span>
                </div>
                <div className="pcc-settings-accordion-trigger__right">
                  <span className="pcc-settings-accordion-trigger__state">
                    {isOpen ? 'Collapse' : 'Expand'}
                  </span>
                  <svg
                    className={cn(
                      'pcc-settings-accordion-chevron',
                      isOpen && 'pcc-settings-accordion-chevron--open'
                    )}
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div
                  id={`pcc-accordion-content-${sec.id}`}
                  role="region"
                  aria-labelledby={`pcc-accordion-header-${sec.id}`}
                  className="pcc-settings-accordion-content"
                >
                  {sec.content()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Connect Integration Modal */}
      {connectModal && (
        <Modal
          isOpen={Boolean(connectModal)}
          onClose={() => {
            setConnectModal(null);
            setConnectError(null);
          }}
          title={`Connect ${connectModal.name}`}
          size="md"
        >
          <form onSubmit={handleConnectIntegration} className="pcc-connect-modal-form">
            {connectError && (
              <div className="pcc-connect-modal-error" role="alert">
                {connectError}
              </div>
            )}

            {(INTEGRATION_FIELDS[connectModal.provider] || []).map((field) => (
              <div key={field.key} className="pcc-connect-modal-field">
                <label htmlFor={`config-${field.key}`}>{field.label}</label>
                <input
                  id={`config-${field.key}`}
                  aria-label={field.label}
                  type={field.type}
                  value={connectConfig[field.key] || ''}
                  onChange={(e) =>
                    setConnectConfig((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  autoComplete="off"
                />
              </div>
            ))}

            <div className="pcc-connect-modal-actions">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => {
                  setConnectModal(null);
                  setConnectError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={isConnecting}
              >
                Connect
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SettingsPage;
