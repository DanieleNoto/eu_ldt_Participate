import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

type Suggestion = { id: string; text: string };
interface ChatResponse {
  conversationId: string;
  answer: string;
  suggestions: Suggestion[];
  isLeaf: boolean;
  options?: { action: string; label: string }[];
}

interface Message { id: string; from: 'bot' | 'user'; text: string; }

interface ChatbotProps {
  apiBase?: string; // e.g. /api/v1
  onSupportSent?: () => void;
  className?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ apiBase = '/api/v1', onSupportSent, className }) => {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [options, setOptions] = useState<{ action: string; label: string }[] | undefined>();
  const [loading, setLoading] = useState(false);
  const [supportMode, setSupportMode] = useState(false);
  const [supportText, setSupportText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const fetchNode = useCallback(async (nodeId?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, nodeId })
      });
      if (!res.ok) throw new Error('Network error');
      const data: ChatResponse = await res.json();
      setConversationId(data.conversationId);
      setMessages(prev => [...prev, { id: uuidv4(), from: 'bot', text: data.answer }]);
      setSuggestions(data.suggestions);
      setOptions(data.options);
      setSupportMode(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiBase, conversationId]);

  const restart = () => {
    setConversationId(undefined);
    setMessages([]);
    setSuggestions([]);
    setOptions(undefined);
    fetchNode();
  };

  const startSupport = () => {
    setSupportMode(true);
    setSupportText('');
  };

  const sendSupport = async () => {
    if (!supportText.trim() || !conversationId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/support/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: supportText })
      });
      if (!res.ok) throw new Error('Support failed');
      setMessages(prev => [...prev, { id: uuidv4(), from: 'user', text: supportText }]);
      setMessages(prev => [...prev, { id: uuidv4(), from: 'bot', text: 'Support request sent. Our team will contact you.' }]);
      setSupportMode(false);
      onSupportSent?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNode(); }, []); // initial
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSuggestionClick = (s: Suggestion) => {
    setMessages(prev => [...prev, { id: uuidv4(), from: 'user', text: s.text }]);
    fetchNode(s.id);
  };

  const handleOption = (action: string) => {
    if (action === 'restart') restart();
    if (action === 'support') startSupport();
  };

  return (
    <div className={`chatbot-container ${className || ''}`.trim()}>
      <div className="chatbot-header">Help Assistant</div>
      <div className="chatbot-messages">
        {messages.map(m => (
          <div key={m.id} className={`msg msg-${m.from}`}>{m.text}</div>
        ))}
        {loading && <div className="msg msg-bot">...</div>}
        <div ref={bottomRef} />
      </div>
      <div className="chatbot-footer">
        {!supportMode && (
          <>
            <div className="suggestions">
              {suggestions.map(s => (
                <button key={s.id} disabled={loading} onClick={() => handleSuggestionClick(s)} className="suggestion-btn">{s.text}</button>
              ))}
            </div>
            {options && (
              <div className="options">
                {options.map(o => (
                  <button key={o.action} disabled={loading} onClick={() => handleOption(o.action)} className="option-btn">{o.label}</button>
                ))}
              </div>
            )}
          </>
        )}
        {supportMode && (
          <div className="support-form">
            <textarea value={supportText} onChange={e => setSupportText(e.target.value)} placeholder="Describe your issue" />
            <div className="support-actions">
              <button onClick={() => setSupportMode(false)} disabled={loading}>Cancel</button>
              <button onClick={sendSupport} disabled={loading || !supportText.trim()}>Send</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .chatbot-container { width: 320px; height: 480px; box-shadow: 0 4px 16px rgba(0,0,0,.15); border-radius: 12px; display:flex; flex-direction:column; font-family: system-ui, sans-serif; background:#fff; }
        .chatbot-header { padding:8px 12px; background:#0d47a1; color:#fff; font-weight:600; border-top-left-radius:12px; border-top-right-radius:12px; font-size:14px; }
        .chatbot-messages { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:6px; }
        .msg { max-width: 90%; padding:8px 10px; border-radius:12px; font-size:13px; line-height:1.3; }
        .msg-bot { background:#f1f5f9; align-self:flex-start; }
        .msg-user { background:#1976d2; color:#fff; align-self:flex-end; }
        .chatbot-footer { padding:6px 8px; border-top:1px solid #e2e8f0; display:flex; flex-direction:column; gap:6px; }
        .suggestions, .options { display:flex; flex-wrap:wrap; gap:4px; }
        .suggestion-btn, .option-btn { background:#e0e7ff; border:none; padding:4px 8px; border-radius:8px; cursor:pointer; font-size:12px; }
        .suggestion-btn:hover, .option-btn:hover { background:#c7d2fe; }
        .support-form { display:flex; flex-direction:column; gap:4px; }
        .support-form textarea { resize:vertical; min-height:80px; font-size:12px; font-family:inherit; padding:6px; border:1px solid #cbd5e1; border-radius:6px; }
        .support-actions { display:flex; justify-content:flex-end; gap:8px; }
        .support-actions button { font-size:12px; padding:4px 10px; border-radius:6px; border:none; cursor:pointer; }
        .support-actions button:last-child { background:#0d47a1; color:#fff; }
      `}</style>
    </div>
  );
};

export default Chatbot;
