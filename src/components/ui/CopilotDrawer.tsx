'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAiConfig } from '@/lib/ai-config';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const QUICK_PROMPTS = [
  { label: 'Heutige Prioritäten', prompt: 'Was sind die wichtigsten Aufgaben und Handlungspunkte für heute?' },
  { label: 'Überfällige Zahlungen', prompt: 'Welche Aufträge haben überfällige oder ausstehende Zahlungen? Wie soll ich vorgehen?' },
  { label: 'Riskante Aufträge', prompt: 'Welche aktiven Aufträge haben das höchste Risiko und warum?' },
  { label: 'Pipeline-Analyse', prompt: 'Wie sieht unsere aktuelle Deal-Pipeline aus? Was sollte ich priorisieren?' },
];

interface CopilotDrawerProps {
  open: boolean;
  onClose: () => void;
  onNav: (view: string) => void;
}

export function CopilotDrawer({ open, onClose, onNav }: CopilotDrawerProps) {
  const { data: M } = useData();
  const { isConfigured, generate, activeModelObj } = useAiConfig();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildSystemPrompt = useCallback(() => {
    const lines = [
      'Du bist der KI-Copilot für EastAfrica Export OS — eine professionelle Handelsplattform für ostafrikanischen Export (Kaffee, Cashews, Sesam, Kakao, Macadamia).',
      'Antworte immer auf Deutsch. Sei präzise, handlungsorientiert und professionell.',
      '',
      `Aktuelle Datenlage (${new Date().toLocaleDateString('de-DE')}):`,
    ];
    if (M) {
      const problemOrders  = M.orders.filter(o => o.status === 'problem').length;
      const overduePayments = M.orders.filter(o => o.paid < 50 && ['delivered','arrived'].includes(o.status)).length;
      const highTasks      = M.tasks.filter(t => t.prio === 'hoch' && t.status !== 'erledigt').length;
      lines.push(
        `- ${M.orders.length} Aufträge gesamt, davon ${problemOrders} mit Status "Problem"`,
        `- ${overduePayments} Aufträge mit überfälliger Zahlung`,
        `- ${M.suppliers.filter(s => s.status === 'aktiv').length} aktive Lieferanten`,
        `- ${M.deals.length} offene Deals (${M.deals.filter(d => d.stage === 'Verhandlung').length} in Verhandlung)`,
        `- ${M.offers.filter(o => ['sent','viewed'].includes(o.status)).length} offene Angebote`,
        `- ${highTasks} Aufgaben mit hoher Priorität`,
      );
    } else {
      lines.push('- Daten werden geladen…');
    }
    return lines.join('\n');
  }, [M]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading || !isConfigured) return;
    const userMsg: Message = { role: 'user', content: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await generate(text.trim(), buildSystemPrompt());
      setMessages(prev => [...prev, { role: 'assistant', content: response, ts: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Fehler: ${(e as Error).message}`, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }, [loading, isConfigured, generate, buildSystemPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="drawer"
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {/* Header */}
        <div className="drawer-head" style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(167,139,250,0.05))',
          borderBottom: '1px solid rgba(167,139,250,0.18)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic name="sparkle" size={13} color="white" />
            </div>
            <span style={{ color: '#c4b5fd', fontWeight: 600, fontSize: 13 }}>AI Copilot</span>
            {activeModelObj && isConfigured && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 6px', background: 'rgba(167,139,250,0.1)', borderRadius: 4 }}>
                {activeModelObj.name}
              </span>
            )}
          </div>
          <span className="tx3" style={{ fontSize: 10.5, marginLeft: 'auto' }}>⌘J</span>
          <button className="btn sm ghost" style={{ marginLeft: 8 }} onClick={onClose}>
            <Ic name="x" size={13} />
          </button>
        </div>

        {/* Not configured state */}
        {!isConfigured && (
          <div style={{ padding: 20, textAlign: 'center', flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Ic name="sparkle" size={18} color="#6366f1" />
            </div>
            <div className="fw600" style={{ fontSize: 13, marginBottom: 4 }}>KI nicht konfiguriert</div>
            <div className="tx3" style={{ fontSize: 11.5, lineHeight: 1.6, marginBottom: 12 }}>
              Hinterlege einen API-Key in den Einstellungen um den Copilot zu aktivieren.
            </div>
            <button className="btn sm primary" onClick={() => { onNav('settings'); onClose(); }}>
              <Ic name="settings" size={12} /> Einstellungen öffnen
            </button>
          </div>
        )}

        {/* Messages area */}
        {isConfigured && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Welcome / quick prompts */}
            {messages.length === 0 && (
              <div>
                <div className="ai-card" style={{ marginBottom: 12, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Wie kann ich helfen?</div>
                  <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                    Stell mir Fragen zu Aufträgen, Lieferanten, Compliance oder lass mich Analysen erstellen.
                    <br /><span className="tx3">Shift+Enter für neue Zeile · Enter zum Senden</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {QUICK_PROMPTS.map((qp, i) => (
                    <button
                      key={i}
                      className="btn ghost"
                      style={{ textAlign: 'left', fontSize: 12, justifyContent: 'flex-start', padding: '7px 10px', borderRadius: 6 }}
                      onClick={() => send(qp.prompt)}
                    >
                      <Ic name="sparkle" size={11} color="#a78bfa" />
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {msg.role === 'user' ? 'Du' : activeModelObj?.name ?? 'Copilot'}
                </div>
                <div style={{
                  maxWidth: '88%',
                  padding: '9px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                  background: msg.role === 'user' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)',
                  border: msg.role === 'user' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  fontSize: 12.5,
                  lineHeight: 1.65,
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px 12px 12px 3px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  {[0,1,2].map(j => (
                    <div key={j} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#a78bfa',
                      animation: `copilot-dot 1.2s ease-in-out ${j * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Input area */}
        {isConfigured && (
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            {messages.length > 0 && (
              <button
                className="btn sm ghost"
                style={{ fontSize: 10.5, marginBottom: 8 }}
                onClick={() => setMessages([])}
              >
                <Ic name="refresh" size={11} /> Neues Gespräch
              </button>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Frag mich etwas…"
                rows={1}
                style={{
                  flex: 1, resize: 'none', overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(167,139,250,0.25)',
                  borderRadius: 8, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5,
                  lineHeight: 1.5, padding: '8px 10px', outline: 'none',
                  minHeight: 36, maxHeight: 120,
                }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                }}
              />
              <button
                className="btn sm primary"
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                style={{ flexShrink: 0, height: 36, width: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ic name="arrow_r" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes copilot-dot{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
