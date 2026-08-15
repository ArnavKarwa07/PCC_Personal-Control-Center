import React, { useState } from 'react';
import { Modal, Button } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import './OnboardingModal.css';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        JSON.parse(text); // validate
        setJsonText(text);
        toast.success(`Loaded JSON file: ${file.name}`);
      } catch {
        toast.error('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      toast.error('Please paste JSON or upload a file first');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        localStorage.setItem('pcc_user_data', JSON.stringify(parsed));
        toast.success('Successfully imported Personal OS data from JSON!');
        onClose();
        window.location.reload();
      }, 600);
    } catch {
      toast.error('Failed to parse JSON string. Please verify schema formatting.');
    }
  };

  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = '/pcc_data_sample.json';
    link.download = 'pcc_data_schema_sample.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info('Downloaded pcc_data_schema_sample.json');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Personal OS Onboarding & JSON Data Loader" size="lg">
      <div className="pcc-onboarding">
        <p className="pcc-onboarding__desc">
          Populate your Personal Control Center by uploading or pasting your structured <code>pcc_data.json</code> payload.
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
            rows={10}
            placeholder='{\n  "user": { "name": "Your Name", "currency": "INR" },\n  "tasks": [...],\n  "finances": { "income": 185000, "expenses": 42000 }\n}'
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
        </div>

        <div className="pcc-onboarding__footer">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleImport} disabled={loading}>
            {loading ? 'Importing...' : 'Load & Initialize Data'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
