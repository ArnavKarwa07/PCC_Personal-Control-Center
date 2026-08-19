import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../services/api';
import './AIAssistantWidget.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantResponse {
  summary?: string;
  intent_detected?: string;
  executed_action?: {
    action_type: string;
    label: string;
    payload: Record<string, unknown>;
  };
  suggested_followups?: string[];
  message?: string;
}

export const AIAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Executive Assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = input.trim();
    if (!trimmedQuery || loading) return;

    // Append user message immediately
    const userMessage: Message = { role: 'user', content: trimmedQuery };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post<AssistantResponse>('/assistant/query', {
        query: trimmedQuery,
      });

      const replyContent =
        response.summary || response.message || 'Action processed successfully.';
      setMessages((prev) => [...prev, { role: 'assistant', content: replyContent }]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unable to reach assistant service.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an issue: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Expanded Chat Panel */}
      {isOpen && (
        <div className="pcc-ai-chat-panel" role="dialog" aria-label="AI Executive Assistant Chat">
          {/* Header Bar */}
          <div className="pcc-ai-chat-header">
            <div className="pcc-ai-chat-header__info">
              <span className="pcc-ai-chat-header__title">AI Executive Assistant</span>
              <span className="pcc-ai-chat-header__status">Autonomous Dispatcher Active</span>
            </div>
            <button
              type="button"
              className="pcc-ai-chat-header__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close Assistant"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Message History Area */}
          <div className="pcc-ai-chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`pcc-ai-message pcc-ai-message--${msg.role}`}
              >
                <div className="pcc-ai-message__content">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="pcc-ai-message pcc-ai-message--assistant pcc-ai-message--typing">
                <div className="pcc-ai-typing-indicator" aria-label="Assistant is thinking">
                  <span className="pcc-ai-typing-dot" />
                  <span className="pcc-ai-typing-dot" />
                  <span className="pcc-ai-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="pcc-ai-chat-input-area">
            <input
              ref={inputRef}
              type="text"
              className="pcc-ai-chat-input"
              placeholder="Ask AI or dispatch command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="pcc-ai-chat-send"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Circular Bubble Button */}
      <button
        type="button"
        className="pcc-ai-bubble"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        title="AI Executive Assistant"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          <path d="M5 3v4" />
          <path d="M19 17v4" />
          <path d="M3 5h4" />
          <path d="M17 19h4" />
        </svg>
      </button>
    </>
  );
};

export default AIAssistantWidget;
