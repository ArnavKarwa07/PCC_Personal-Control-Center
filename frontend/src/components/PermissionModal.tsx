import React, { useState, useEffect } from 'react';
import './PermissionModal.css';

export interface PermissionModalProps {
  isOpen: boolean;
  onGrantAll: () => void | Promise<void>;
  onSkip: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onGrantAll,
  onSkip,
}) => {
  const [isGranting, setIsGranting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onSkip();
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
  }, [isOpen, onSkip]);

  if (!isOpen) return null;

  const handleGrant = async () => {
    try {
      setIsGranting(true);
      await onGrantAll();
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div
      className="pcc-perm-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pcc-perm-title"
    >
      <div className="pcc-perm-modal-card">
        {/* Brand & Header */}
        <div className="pcc-perm-modal-header">
          <div className="pcc-perm-modal-brand-badge">
            <img
              src="/logo.png"
              alt="PCC Logo"
              className="pcc-perm-modal-logo"
              onError={(e) => {
                // Fallback SVG icon if logo image fails to load
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h2 id="pcc-perm-title" className="pcc-perm-modal-title">
            System Permissions Required
          </h2>
          <p className="pcc-perm-modal-subtitle">
            Personal Control Center needs a few core system capabilities to deliver real-time alerts, exact alarms, and local environmental telemetry.
          </p>
        </div>

        {/* 3 Feature Cards */}
        <div className="pcc-perm-modal-features">
          {/* 1. Notifications */}
          <div className="pcc-perm-feature-card">
            <div className="pcc-perm-feature-icon-wrapper pcc-perm-feature-icon-wrapper--notifications">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <div className="pcc-perm-feature-content">
              <div className="pcc-perm-feature-title-row">
                <h3 className="pcc-perm-feature-title">🔔 Notifications</h3>
                <span className="pcc-perm-feature-tag">Alarms & Task Reminders</span>
              </div>
              <p className="pcc-perm-feature-desc">
                Real-time alerts for scheduled tasks, system notifications, and active reminders.
              </p>
            </div>
          </div>

          {/* 2. Exact Alarms */}
          <div className="pcc-perm-feature-card">
            <div className="pcc-perm-feature-icon-wrapper pcc-perm-feature-icon-wrapper--alarms">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2 2" />
                <path d="M5 3L2 6" />
                <path d="M22 6l-3-3" />
              </svg>
            </div>
            <div className="pcc-perm-feature-content">
              <div className="pcc-perm-feature-title-row">
                <h3 className="pcc-perm-feature-title">⏰ Exact Alarms</h3>
                <span className="pcc-perm-feature-tag">Timers & Wakeup Telemetry</span>
              </div>
              <p className="pcc-perm-feature-desc">
                High-precision background timers and persistent wakeup alarms that ring reliably.
              </p>
            </div>
          </div>

          {/* 3. Location Telemetry */}
          <div className="pcc-perm-feature-card">
            <div className="pcc-perm-feature-icon-wrapper pcc-perm-feature-icon-wrapper--location">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="pcc-perm-feature-content">
              <div className="pcc-perm-feature-title-row">
                <h3 className="pcc-perm-feature-title">📍 Location Telemetry</h3>
                <span className="pcc-perm-feature-tag">Pune Weather & Telemetry</span>
              </div>
              <p className="pcc-perm-feature-desc">
                Accurate local weather forecasts (Pune, IN), solar telemetry, and atmospheric data.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pcc-perm-modal-actions">
          <button
            type="button"
            className="pcc-perm-btn-grant"
            onClick={handleGrant}
            disabled={isGranting}
          >
            {isGranting ? (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span>Granting Permissions...</span>
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>Grant All Permissions</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="pcc-perm-btn-skip"
            onClick={onSkip}
            disabled={isGranting}
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};
