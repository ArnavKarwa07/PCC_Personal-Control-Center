import React, { useState } from 'react';
import { Card, Button, Input, Modal } from './ui';
import { useToast } from '../hooks/useToast';
import './AIAssistantWidget.css';

export const AIAssistantWidget: React.FC = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);

  const handleDispatchQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (query.toLowerCase().includes('task') || query.toLowerCase().includes('remind')) {
        setResponse(`Executed Autonomous Action: Created Task "${query}" in workspace inbox.`);
        toast.success('AI Assistant created task');
      } else if (query.toLowerCase().includes('note')) {
        setResponse(`Recorded note entry into knowledge base: "${query}".`);
        toast.success('AI Assistant saved note');
      } else {
        setResponse(`PCC Executive Assistant: Analyzed query "${query}". All system metrics optimal.`);
        toast.info('AI Assistant query processed');
      }
      setQuery('');
    }, 500);
  };

  return (
    <>
      <Card glass padding="md" className="pcc-ai-widget">
        <div className="pcc-ai-widget__header">
          <div className="pcc-ai-widget__brand">
            <span className="pcc-ai-widget__icon">🤖</span>
            <div>
              <div className="pcc-ai-widget__title">AI Executive Assistant</div>
              <div className="pcc-ai-widget__status">Autonomous Dispatcher Active</div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setBriefingOpen(true)}>
            Daily Briefing
          </Button>
        </div>

        <form onSubmit={handleDispatchQuery} className="pcc-ai-widget__form">
          <Input
            id="ai-query-input"
            placeholder="Type natural command... e.g. 'Remind me to sync with Sarah tomorrow'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Processing...' : 'Dispatch'}
          </Button>
        </form>

        {response && (
          <div className="pcc-ai-widget__response">
            <span>✨ {response}</span>
          </div>
        )}
      </Card>

      <Modal
        isOpen={briefingOpen}
        onClose={() => setBriefingOpen(false)}
        title="Executive Daily Briefing"
      >
        <div className="pcc-briefing-modal">
          <p className="pcc-briefing-greeting">Good day! Here is your AI Executive Summary for today:</p>
          <div className="pcc-briefing-stats">
            <div className="pcc-briefing-stat">
              <span className="pcc-briefing-stat__val">7</span>
              <span className="pcc-briefing-stat__lbl">Open Tasks</span>
            </div>
            <div className="pcc-briefing-stat">
              <span className="pcc-briefing-stat__val">2</span>
              <span className="pcc-briefing-stat__lbl">Calendar Events</span>
            </div>
            <div className="pcc-briefing-stat">
              <span className="pcc-briefing-stat__val">12 Days</span>
              <span className="pcc-briefing-stat__lbl">Habit Streak</span>
            </div>
          </div>

          <div className="pcc-briefing-section">
            <h4>Priority Recommendation:</h4>
            <p>Focus on finalizing Phase E verification and completing high priority tasks before 17:00.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="primary" onClick={() => setBriefingOpen(false)}>Acknowledge</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
