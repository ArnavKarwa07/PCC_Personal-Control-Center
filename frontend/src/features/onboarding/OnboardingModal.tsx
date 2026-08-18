import React, { useState, useMemo } from 'react';
import { Modal, Button, Badge } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { validateAndCleanImportData, executeDataImport, ImportResult } from '../../services/jsonImportService';
import { soundEffects } from '../../utils/audio';
import './OnboardingModal.css';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);

  const validation: ImportResult | null = useMemo(() => {
    if (!jsonText.trim()) return null;
    return validateAndCleanImportData(jsonText);
  }, [jsonText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = (event.target?.result as string) || '';
        setJsonText(text);
        const result = validateAndCleanImportData(text);
        if (result.success) {
          toast.success(`Loaded JSON file "${file.name}" with ${result.stats.totalImported} items`);
        } else {
          toast.warning(`Loaded file "${file.name}" - see validation report below`);
        }
      } catch {
        toast.error('Failed to read selected JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      toast.error('Please paste JSON or upload a pcc_data.json file first');
      return;
    }

    if (!validation || !validation.success) {
      const firstErr = validation?.issues.find((i) => i.level === 'error')?.message || 'JSON schema validation failed.';
      toast.error(firstErr);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        executeDataImport(validation.payload);
        soundEffects.playChime();
        const s = validation.stats;
        toast.success(
          `Imported ${s.tasks} tasks, ${s.projects} projects, ${s.notes} notes, ${s.ideas} ideas, ${s.calendarEvents} events, ${s.reminders} reminders successfully!`
        );
        setLoading(false);
        onClose();
        window.location.reload();
      } catch (err: any) {
        setLoading(false);
        toast.error(`Import failed: ${err?.message || 'Unknown error'}`);
      }
    }, 400);
  };

  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = '/pcc_sample_data.json';
    link.download = 'pcc_sample_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info('Downloaded pcc_sample_data.json template');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Personal OS Onboarding & JSON Data Seeding" size="lg">
      <div className="pcc-onboarding">
        <p className="pcc-onboarding__desc">
          Populate your Personal Control Center workspace by uploading or pasting your structured <code>pcc_data.json</code> payload.
        </p>

        <div className="pcc-onboarding__actions">
          <label className="pcc-upload-btn">
            📂 Upload pcc_data.json File
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <Button variant="outline" size="sm" onClick={handleDownloadSample}>
            📥 Download Sample JSON Schema
          </Button>
        </div>

        <div className="pcc-onboarding__editor">
          <label htmlFor="pcc-json-textarea">Or paste raw JSON payload directly:</label>
          <textarea
            id="pcc-json-textarea"
            rows={8}
            placeholder='{\n  "user": { "name": "Arnav Karwa", "currency": "₹ (INR)" },\n  "tasks": [...],\n  "projects": [...],\n  "notes": [...]\n}'
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
        </div>

        {/* Live Validation & Domain Stats Report */}
        {validation && (
          <div className="pcc-onboarding__report">
            <div className="pcc-onboarding__report-header">
              <span className="pcc-onboarding__report-title">
                {validation.success ? '✅ Valid Schema' : '⚠️ Validation Issues Detected'}
              </span>
              <Badge variant={validation.success ? 'success' : 'warning'}>
                {validation.stats.totalImported} Entities Found
              </Badge>
            </div>

            {/* Entity Stats Breakdown */}
            <div className="pcc-onboarding__stats-grid">
              {validation.stats.tasks > 0 && <span className="pcc-stat-pill">Tasks: {validation.stats.tasks}</span>}
              {validation.stats.projects > 0 && <span className="pcc-stat-pill">Projects: {validation.stats.projects}</span>}
              {validation.stats.notes > 0 && <span className="pcc-stat-pill">Notes: {validation.stats.notes}</span>}
              {validation.stats.ideas > 0 && <span className="pcc-stat-pill">Ideas: {validation.stats.ideas}</span>}
              {validation.stats.calendarEvents > 0 && <span className="pcc-stat-pill">Events: {validation.stats.calendarEvents}</span>}
              {validation.stats.goals > 0 && <span className="pcc-stat-pill">Goals: {validation.stats.goals}</span>}
              {validation.stats.contacts > 0 && <span className="pcc-stat-pill">Contacts: {validation.stats.contacts}</span>}
              {validation.stats.reminders > 0 && <span className="pcc-stat-pill">Reminders: {validation.stats.reminders}</span>}
              {validation.stats.alarms > 0 && <span className="pcc-stat-pill">Alarms: {validation.stats.alarms}</span>}
            </div>

            {/* Warnings or Syntax Errors */}
            {validation.issues.length > 0 && (
              <div className="pcc-onboarding__issues">
                {validation.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`pcc-onboarding__issue-item pcc-onboarding__issue-item--${issue.level}`}
                  >
                    <span className="pcc-issue-domain">[{issue.domain}]</span> {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pcc-onboarding__footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={loading || (Boolean(jsonText.trim()) && Boolean(validation && !validation.success))}
          >
            {loading ? 'Importing...' : 'Load & Initialize Data'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
