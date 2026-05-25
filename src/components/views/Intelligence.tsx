'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { fmtCur } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Sparkline, BarChart } from '@/components/ui/primitives';
import type { Order, Supplier, Document as Doc, QualityCheck } from '@/lib/types';
import { useAiConfig } from '@/lib/ai-config';

interface IntelligenceViewProps {
  lang: Lang;
  onOpenOrder: (o: Order) => void;
  onNav: (view: string) => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function seedRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function idSeed(id: string): number {
  return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

const palette = (score: number) => {
  if (score >= 60) return '#ef4444';
  if (score >= 35) return '#f59e0b';
  if (score >= 15) return '#fbbf24';
  return '#34d399';
};

// ── KI-Status-Banner (shared) ─────────────────────────────────────────────────

function KiBanner({ onNav }: { onNav: (v: string) => void }) {
  const { isConfigured } = useAiConfig();
  if (isConfigured) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 7, marginBottom: 14, fontSize: 12 }}>
      <Ic name="sparkle" size={13} color="#a78bfa" />
      <span className="tx2">KI-Funktionen nicht aktiv — hinterlege einen API-Key in</span>
      <button className="btn sm" onClick={() => onNav('settings')} style={{ padding: '3px 10px' }}>Einstellungen →</button>
    </div>
  );
}

// ── Risk Engine ───────────────────────────────────────────────────────────────

interface RiskFactor { k: string; v: number; w: number; note: string; }
interface RiskResult { score: number; factors: RiskFactor[]; }

function computeRiskScore(order: Order, suppliers: Supplier[], documents: Doc[], quality: QualityCheck[]): RiskResult {
  const ref = new Date('2026-05-25');
  const etd = new Date(order.etd);
  const daysToETD = Math.round((etd.getTime() - ref.getTime()) / 86400000);
  const supplier = suppliers.find(s => s.id === order.supplierId);

  const supplierScore = supplier ? (supplier.risk === 'hoch' ? 80 : supplier.risk === 'mittel' ? 45 : 15) : 60;

  const docs = documents.filter(d => d.order === order.id);
  const missingDocs = docs.filter(d => d.status === 'fehlt').length;
  const draftDocs = docs.filter(d => d.status === 'Entwurf').length;
  const docScore = missingDocs > 0 ? 80 : draftDocs > 0 ? 50 : docs.length === 0 ? 40 : 10;

  const paymentScore = order.paid === 0 ? 70 : order.paid < 30 ? 50 : order.paid < 100 ? 30 : 5;
  const etaPressure = daysToETD < 0 ? 90 : daysToETD < 5 ? 75 : daysToETD < 14 ? 45 : 15;

  const qc = quality.find(q => q.batch === order.batch);
  const qualScore = qc?.status === 'blocked' ? 90 : qc?.status === 'in_progress' ? 40 : qc?.status === 'released' ? 5 : 35;

  const marginPct = order.revenue > 0 ? (order.profit / order.revenue) * 100 : 0;
  const marginScore = marginPct < 10 ? 70 : marginPct < 20 ? 40 : 15;
  const complianceScore = order.status === 'problem' ? 90 : order.problem ? 70 : 10;

  const factors: RiskFactor[] = [
    { k: 'Lieferant',   v: supplierScore,   w: 0.20, note: supplier?.risk ?? '—' },
    { k: 'Dokumente',   v: docScore,         w: 0.20, note: missingDocs > 0 ? `${missingDocs} fehlt` : 'ok' },
    { k: 'Zahlung',     v: paymentScore,     w: 0.18, note: `${order.paid}% bezahlt` },
    { k: 'ETA-Druck',   v: etaPressure,      w: 0.15, note: `${daysToETD}d bis ETD` },
    { k: 'Qualität',    v: qualScore,        w: 0.12, note: qc?.status ?? 'kein QC' },
    { k: 'Marge',       v: marginScore,      w: 0.10, note: `${marginPct.toFixed(0)}%` },
    { k: 'Compliance',  v: complianceScore,  w: 0.05, note: order.status },
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.v * f.w, 0));
  return { score, factors };
}

// ── Tab 1: Briefing ──────────────────────────────────────────────────────────

const BriefingTab = ({ onNav }: IntelligenceViewProps) => {
  const { data: M } = useData();
  const { isConfigured, generate, activeModelObj } = useAiConfig();
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const criticalOrders  = M.orders.filter(o => o.status === 'problem');
  const overduePayments = M.orders.filter(o => o.paid < 50 && ['delivered', 'arrived'].includes(o.status));
  const openOffers      = M.offers.filter(o => ['sent', 'viewed'].includes(o.status));
  const overdueAmount   = overduePayments.reduce((s, o) => s + o.revenue * (100 - o.paid) / 100, 0);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const systemPrompt = 'Du bist ein erfahrener Handelsanalyst für ein Ostafrika-Export-Unternehmen (Kaffee, Cashews, Sesam, Kakao, Macadamia). Antworte prägnant auf Deutsch in max. 6 Stichpunkten mit konkreten Handlungsempfehlungen.';
      const prompt = `Morgen-Briefing für ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}:

Datenlage:
- Aktive Aufträge: ${M.orders.length}
- Problem-Aufträge: ${criticalOrders.length}${criticalOrders.length > 0 ? ' (' + criticalOrders.map(o => o.id).join(', ') + ')' : ''}
- Überfällige Zahlungen: ${overduePayments.length} (${fmtCur(overdueAmount)} offen)
- Offene Angebote: ${openOffers.length}
- Aktive Lieferanten: ${M.suppliers.filter(s => s.status === 'aktiv').length}
- Offene Deals: ${M.deals.length} (${fmtCur(M.deals.reduce((s, d) => s + d.value * d.prob / 100, 0))} gewichtet)
- Hohe Aufgaben-Priorität: ${M.tasks.filter(t => t.prio === 'hoch' && t.status !== 'erledigt').length}

Erstelle ein kompaktes Tages-Briefing mit den wichtigsten Handlungspunkten für heute.`;
      const text = await generate(prompt, systemPrompt);
      setBriefing(text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <KiBanner onNav={onNav} />

      {/* AI Card */}
      <div className="ai-card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ic name="sparkle" size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                AI · Morgen-Briefing
              </span>
              {activeModelObj && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{activeModelObj.name}</span>
              )}
              <button
                className="btn sm primary"
                style={{ marginLeft: 'auto' }}
                onClick={handleGenerate}
                disabled={!isConfigured || loading}
              >
                <Ic name="sparkle" size={11} />
                {loading ? 'Generiere…' : briefing ? 'Neu generieren' : 'Briefing generieren'}
              </button>
            </div>

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                <Ic name="refresh" size={13} color="#a78bfa" />
                Analysiere Daten…
              </div>
            )}

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 5, fontSize: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}

            {briefing && !loading && (
              <div style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {briefing}
              </div>
            )}

            {!briefing && !loading && !error && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {isConfigured ? `Bereit · ${activeModelObj?.name}` : 'KI-Briefing noch nicht konfiguriert'}
                </div>
                <div className="tx2" style={{ fontSize: 12, lineHeight: 1.6 }}>
                  {isConfigured
                    ? 'Klicke auf "Briefing generieren" um eine KI-Analyse der aktuellen Geschäftslage zu erhalten.'
                    : 'Hinterlege einen API-Key in den Einstellungen um automatische Tagesanalysen zu erhalten.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Data */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-head">
              <Ic name="sparkle" size={14} />
              <span className="title">Aktuelle Situation — Live aus Datenbank</span>
            </div>
            <div className="card-body">
              {criticalOrders.length === 0 && overduePayments.length === 0 && openOffers.length === 0 ? (
                <div className="tx3" style={{ textAlign: 'center', padding: '20px 0' }}>Keine kritischen Einträge gefunden</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {criticalOrders.map(o => (
                    <div key={o.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <Badge kind="danger">Problem</Badge>
                      <div style={{ flex: 1, fontSize: 12 }}>{o.id} · {o.productVariant}</div>
                      <span className="mono tx3" style={{ fontSize: 11 }}>{fmtCur(o.revenue)}</span>
                    </div>
                  ))}
                  {overduePayments.map(o => (
                    <div key={o.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <Badge kind="warning">Überfällig</Badge>
                      <div style={{ flex: 1, fontSize: 12 }}>{o.id} · {o.paid}% bezahlt</div>
                      <span className="mono tx3" style={{ fontSize: 11 }}>{fmtCur(o.revenue * (100 - o.paid) / 100)} offen</span>
                    </div>
                  ))}
                  {openOffers.map(o => (
                    <div key={o.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <Badge kind="info">Angebot</Badge>
                      <div style={{ flex: 1, fontSize: 12 }}>{o.id} · Status: {o.status}</div>
                      <span className="mono tx3" style={{ fontSize: 11 }}>{fmtCur(o.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-head"><Ic name="activity" size={14} /><span className="title">Übersicht</span></div>
            <div className="card-body">
              {[
                { l: 'Aufträge gesamt',        v: M.orders.length },
                { l: 'Problem-Aufträge',       v: criticalOrders.length },
                { l: 'Offene Angebote',        v: openOffers.length },
                { l: 'Überfällige Zahlungen',  v: overduePayments.length },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="tx2">{s.l}</span>
                  <span className="mono fw600">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><Ic name="history" size={14} /><span className="title">KI-Aktivitätslog</span></div>
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div className="tx3" style={{ fontSize: 12 }}>
                {briefing ? '1 Briefing generiert heute' : 'Noch keine KI-Aktionen aufgezeichnet'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Tab 2: Risk Engine ────────────────────────────────────────────────────────

const RiskEngineTab = ({ onOpenOrder }: { lang: Lang; onOpenOrder: (o: Order) => void }) => {
  const { data: M } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ranked = useMemo(() => {
    if (!M) return [];
    return M.orders
      .map(o => ({ order: o, ...computeRiskScore(o, M.suppliers, M.documents, M.quality) }))
      .sort((a, b) => b.score - a.score);
  }, [M]);

  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const selected = ranked.find(r => r.order.id === selectedId);

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14 }}>
      <div className="card">
        <div className="card-head">
          <Ic name="warn" size={14} />
          <span className="title">Risiko-Ranking — alle Aufträge</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="tbl" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>#</th><th>Auftrag</th><th>Score</th><th>Trend</th><th>Status</th><th>ETA</th><th>Wert</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const rng = seedRand(idSeed(r.order.id));
                const spark = Array.from({ length: 8 }, () => Math.round(r.score + (rng() - 0.5) * 24));
                const isSelected = r.order.id === selectedId;
                return (
                  <tr
                    key={r.order.id}
                    onClick={() => setSelectedId(isSelected ? null : r.order.id)}
                    style={{ cursor: 'pointer', background: isSelected ? 'rgba(99,102,241,0.08)' : undefined }}
                  >
                    <td className="mono tx3" style={{ fontSize: 11 }}>{i + 1}</td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{r.order.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono fw700" style={{ fontSize: 14, color: palette(r.score) }}>{r.score}</span>
                        <div style={{ width: 32, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.score}%`, background: palette(r.score), borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                    <td><Sparkline data={spark} w={60} h={22} color={palette(r.score)} /></td>
                    <td><Badge kind={r.score >= 60 ? 'danger' : r.score >= 35 ? 'warning' : r.score >= 15 ? 'neutral' : 'success'}>{r.order.status}</Badge></td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{r.order.eta.slice(5)}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{fmtCur(r.order.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <Ic name="activity" size={14} />
          <span className="title">{selected ? `Drilldown — ${selected.order.id}` : 'Auftrag auswählen'}</span>
        </div>
        {selected ? (
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <svg width={120} height={120} viewBox="0 0 120 120">
                <circle cx={60} cy={60} r={46} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
                <circle cx={60} cy={60} r={46} fill="none" stroke={palette(selected.score)} strokeWidth={12}
                  strokeDasharray={`${(selected.score / 100) * 288.9} 288.9`}
                  strokeDashoffset={0} transform="rotate(-90 60 60)" strokeLinecap="round" />
                <text x={60} y={56} textAnchor="middle" fontSize={24} fontWeight={700} fill={palette(selected.score)} fontFamily="var(--font-mono)">{selected.score}</text>
                <text x={60} y={72} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.4)">Risiko-Score</text>
              </svg>
            </div>
            {selected.factors.map((f, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span>{f.k} <span className="tx3">(×{f.w.toFixed(2)})</span></span>
                  <span className="mono" style={{ color: palette(f.v) }}>{f.v} <span className="tx3">{f.note}</span></span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.v}%`, background: palette(f.v), borderRadius: 2 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              <button className="btn sm primary" onClick={() => onOpenOrder(selected.order)}>Auftrag öffnen</button>
              <button className="btn sm" onClick={() => setSelectedId(null)}>Schließen</button>
            </div>
          </div>
        ) : (
          <div className="card-body">
            <div className="empty tx3" style={{ textAlign: 'center', paddingTop: 40 }}>Klicke auf einen Auftrag für Details</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Tab 3: Anomalies ──────────────────────────────────────────────────────────

const AnomalyTab = () => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const complaints   = M.complaints.filter(c => c.status !== 'geschlossen');
  const blockedQC    = M.quality.filter(q => q.status === 'blocked');
  const problemOrders = M.orders.filter(o => o.status === 'problem');
  const hasItems     = complaints.length > 0 || blockedQC.length > 0 || problemOrders.length > 0;

  return (
    <div style={{ padding: 16 }}>
      {!hasItems ? (
        <div className="card">
          <div className="card-body" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ marginBottom: 8 }}><Ic name="activity" size={28} color="var(--text-3)" /></div>
            <div className="fw600" style={{ fontSize: 14, marginBottom: 6 }}>Keine Anomalien erkannt</div>
            <div className="tx3" style={{ fontSize: 12 }}>Offene Reklamationen, blockierte QC-Checks und Problem-Aufträge werden hier angezeigt.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {problemOrders.map(o => (
            <div key={o.id} className="card" style={{ borderLeft: '3px solid #ef4444' }}>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><Badge kind="danger">Problem-Auftrag</Badge></div>
                <div className="fw600" style={{ fontSize: 12.5, marginBottom: 4 }}>{o.id} · {o.productVariant}</div>
                <div className="tx2" style={{ fontSize: 11 }}>{fmtCur(o.revenue)} · {o.status}</div>
              </div>
            </div>
          ))}
          {blockedQC.map(q => (
            <div key={q.id} className="card" style={{ borderLeft: '3px solid #f59e0b' }}>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><Badge kind="warning">QC blockiert</Badge></div>
                <div className="fw600" style={{ fontSize: 12.5, marginBottom: 4 }}>{q.id} · {q.product}</div>
                <div className="tx2" style={{ fontSize: 11 }}>Charge: {q.batch} · {q.date}</div>
              </div>
            </div>
          ))}
          {complaints.map(c => (
            <div key={c.id} className="card" style={{ borderLeft: '3px solid #60a5fa' }}>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <Badge kind="info">Reklamation</Badge>
                  <Badge kind={c.sev === 'hoch' ? 'danger' : c.sev === 'mittel' ? 'warning' : 'neutral'}>{c.sev}</Badge>
                </div>
                <div className="fw600" style={{ fontSize: 12.5, marginBottom: 4 }}>{c.t}</div>
                <div className="tx2" style={{ fontSize: 11 }}>{c.id} · {c.cat}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab 4: Forecast ───────────────────────────────────────────────────────────

const ForecastTab = () => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const activeOrders = M.orders.filter(o => !['done','paid','delivered'].includes(o.status));
  const marginData = activeOrders.map(o => ({
    m: o.id.slice(-4),
    v: o.revenue > 0 ? parseFloat(((o.profit / o.revenue) * 100).toFixed(1)) : 0,
  })) as unknown as Record<string, number | string>[];

  const paymentRisk = M.buyers.slice(0, 8).map(b => {
    const buyerOrders = M.orders.filter(o => o.buyerId === b.id);
    const avgPaid = buyerOrders.length > 0
      ? buyerOrders.reduce((s, o) => s + o.paid, 0) / buyerOrders.length
      : 100;
    return { name: b.name.split(' ').slice(0, 2).join(' '), risk: Math.max(0, Math.min(100, Math.round(100 - avgPaid))) };
  }).sort((a, b) => b.risk - a.risk);

  const qualityRisk = M.suppliers.slice(0, 8).map(s => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    risk: s.risk === 'hoch' ? 75 : s.risk === 'mittel' ? 45 : 15,
  })).sort((a, b) => b.risk - a.risk);

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div className="card" style={{ gridColumn: 'span 2' }}>
        <div className="card-head"><Ic name="chart" size={14} /><span className="title">Marge je aktivem Auftrag (%)</span></div>
        {activeOrders.length === 0 ? (
          <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
            <div className="tx3" style={{ fontSize: 12 }}>Keine aktiven Aufträge</div>
          </div>
        ) : (
          <div className="card-body"><BarChart data={marginData} w={800} h={120} color="#34d399" valKey="v" lblKey="m" /></div>
        )}
      </div>

      <div className="card">
        <div className="card-head"><Ic name="finance" size={14} /><span className="title">Zahlungsrisiko je Käufer</span></div>
        <div className="card-body">
          {paymentRisk.map((p, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span>{p.name}</span>
                <span className="mono" style={{ color: palette(p.risk) }}>{p.risk}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${p.risk}%`, background: palette(p.risk), borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><Ic name="quality" size={14} /><span className="title">Qualitätsrisiko je Lieferant</span></div>
        <div className="card-body">
          {qualityRisk.map((q, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span>{q.name}</span>
                <span className="mono" style={{ color: palette(q.risk) }}>{q.risk}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${q.risk}%`, background: palette(q.risk), borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Tab 5: Decision Support ───────────────────────────────────────────────────

const DECISION_PRESETS = [
  'Soll ich Auftrag ORD-2026-0144 trotz fehlendem QC-Freigabe verschiffen?',
  'Welchem Lieferanten soll ich für die nächste Cashew-Saison mehr Volumen geben?',
  'Wie priorisiere ich die offenen Angebote nach Abschlusswahrscheinlichkeit?',
  'Welche Maßnahmen empfiehlst du bei einer Zahlungsverzögerung >30 Tage?',
];

const DecisionTab = ({ onNav }: { onNav: (v: string) => void }) => {
  const { data: M } = useData();
  const { isConfigured, generate, activeModelObj } = useAiConfig();
  const [question, setQuestion]   = useState('');
  const [answer, setAnswer]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    setError(null);
    try {
      const context = M
        ? `Aktuelle Datenlage: ${M.orders.length} Aufträge, ${M.suppliers.filter(s => s.status === 'aktiv').length} aktive Lieferanten, ${M.orders.filter(o => o.status === 'problem').length} Problem-Aufträge, ${M.deals.length} offene Deals.`
        : '';
      const systemPrompt = 'Du bist ein erfahrener Handelsberater für Ostafrika-Export (Kaffee, Cashews, Sesam, Kakao, Macadamia). Gib strukturierte, konkrete Empfehlungen auf Deutsch. Nutze Stichpunkte und klare Abschnitte.';
      const prompt = `${context}\n\nFrage: ${question}\n\nBitte antworte mit:\n1. Empfehlung\n2. Begründung\n3. Risiken & Gegenmaßnahmen\n4. Nächste Schritte`;
      const text = await generate(prompt, systemPrompt);
      setAnswer(text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <KiBanner onNav={onNav} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Input */}
        <div className="card">
          <div className="card-head">
            <Ic name="sparkle" size={14} />
            <span className="title">KI-Entscheidungsberater</span>
            {activeModelObj && <span className="meta">{activeModelObj.name}</span>}
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 10 }}>
              <div className="tx3" style={{ fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Schnellfragen</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {DECISION_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    className="btn sm ghost"
                    style={{ textAlign: 'left', fontSize: 11, whiteSpace: 'normal', height: 'auto', padding: '5px 8px' }}
                    onClick={() => setQuestion(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div className="tx3" style={{ fontSize: 10, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Eigene Frage</div>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Stelle eine Frage zu Strategie, Lieferanten, Käufern, Aufträgen…"
                style={{
                  width: '100%', height: 100, resize: 'vertical', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12,
                  lineHeight: 1.6, padding: 10, outline: 'none',
                }}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAsk(); }}
              />
            </div>
            <button
              className="btn primary"
              style={{ width: '100%' }}
              onClick={handleAsk}
              disabled={!isConfigured || loading || !question.trim()}
            >
              <Ic name="sparkle" size={13} />
              {loading ? 'Analysiere…' : 'Analyse starten'}
            </button>
            {!isConfigured && (
              <div className="tx3" style={{ fontSize: 11, textAlign: 'center', marginTop: 6 }}>
                API-Key erforderlich — <button className="btn sm ghost" style={{ fontSize: 11 }} onClick={() => onNav('settings')}>Einstellungen →</button>
              </div>
            )}
          </div>
        </div>

        {/* Answer */}
        <div className="card">
          <div className="card-head">
            <Ic name="doc" size={14} />
            <span className="title">KI-Analyse</span>
          </div>
          <div className="card-body">
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
                <Ic name="refresh" size={24} color="#a78bfa" />
                <div className="tx2" style={{ fontSize: 12 }}>Analysiere Situation…</div>
              </div>
            )}
            {error && (
              <div style={{ padding: '10px 12px', borderRadius: 6, fontSize: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}
            {answer && !loading && (
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {answer}
              </div>
            )}
            {!answer && !loading && !error && (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Ic name="sparkle" size={28} color="var(--text-3)" />
                <div className="tx3" style={{ fontSize: 12, marginTop: 10 }}>
                  Wähle eine Schnellfrage oder stelle eine eigene Frage
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Tab 6: Content & Documents ────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'offer_letter',       label: 'Angebotsschreiben' },
  { id: 'follow_up',          label: 'Follow-Up Email' },
  { id: 'intro_letter',       label: 'Einführungsschreiben' },
  { id: 'product_sheet',      label: 'Produktblatt' },
  { id: 'quality_report',     label: 'Qualitätsbericht' },
  { id: 'complaint_response', label: 'Reklamationsantwort' },
  { id: 'shipping_notice',    label: 'Versandbenachrichtigung' },
  { id: 'payment_reminder',   label: 'Zahlungserinnerung' },
  { id: 'contract_intro',     label: 'Vertragseinleitung' },
  { id: 'newsletter',         label: 'Newsletter' },
  { id: 'customs_letter',     label: 'Zollbegleitschreiben' },
];

const LANG_NAMES: Record<string, string> = {
  DE: 'Deutsch', EN: 'Englisch', FR: 'Französisch', IT: 'Italienisch',
};

const ContentDocTab = ({ onNav }: { onNav: (v: string) => void }) => {
  const { isConfigured, generate, activeModelObj } = useAiConfig();
  const [subTab, setSubTab]           = useState<'studio' | 'inspector'>('studio');
  const [template, setTemplate]       = useState('offer_letter');
  const [audience, setAudience]       = useState('B2B Importeur');
  const [tone, setTone]               = useState('professionell');
  const [contentLang, setContentLang] = useState('DE');
  const [context, setContext]         = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [generating, setGenerating]   = useState(false);
  const [genError, setGenError]       = useState<string | null>(null);

  const templateLabel = TEMPLATES.find(t => t.id === template)?.label || template;

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const systemPrompt = `Du bist ein professioneller Texter für ein Ostafrika-Export-Unternehmen (Kaffee, Cashews, Sesam, Kakao, Macadamia). Erstelle vollständige, professionelle ${templateLabel}-Texte in ${LANG_NAMES[contentLang]}. Ton: ${tone}.`;
      const prompt = `Erstelle einen vollständigen ${templateLabel}.

Zielgruppe: ${audience}
Ton: ${tone}
Sprache: ${LANG_NAMES[contentLang]}
${context ? `\nZusätzlicher Kontext: ${context}` : ''}

Gib den fertigen Text direkt aus, ohne Erklärungen oder Kommentare. Nutze eine passende Struktur mit Betreff, Anrede, Inhalt und Abschluss.`;
      const text = await generate(prompt, systemPrompt);
      setGeneratedText(text);
    } catch (e) {
      setGenError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const sel: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text)', borderRadius: 5, padding: '5px 8px', fontSize: 11,
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        <button className={`btn ${subTab === 'studio' ? 'primary' : ''}`} onClick={() => setSubTab('studio')}>
          <Ic name="edit" size={13} /> Content Studio
        </button>
        <button className={`btn ${subTab === 'inspector' ? 'primary' : ''}`} onClick={() => setSubTab('inspector')}>
          <Ic name="doc" size={13} /> Document Inspector
        </button>
      </div>

      {subTab === 'studio' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14 }}>
          {/* Settings Panel */}
          <div className="card">
            <div className="card-head"><Ic name="settings" size={14} /><span className="title">Einstellungen</span></div>
            <div className="card-body">
              {activeModelObj && (
                <div style={{ marginBottom: 10, padding: '5px 8px', background: 'rgba(99,102,241,0.08)', borderRadius: 5, fontSize: 10.5, color: '#a78bfa' }}>
                  ◆ {activeModelObj.name}
                </div>
              )}
              <div style={{ marginBottom: 10 }}>
                <div className="tx3" style={{ fontSize: 10, marginBottom: 4 }}>Vorlage</div>
                <select value={template} onChange={e => setTemplate(e.target.value)} style={sel}>
                  {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div className="tx3" style={{ fontSize: 10, marginBottom: 4 }}>Zielgruppe</div>
                <select value={audience} onChange={e => setAudience(e.target.value)} style={sel}>
                  {['B2B Importeur', 'Röster', 'Distributor', 'Retail', 'Investor'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div className="tx3" style={{ fontSize: 10, marginBottom: 4 }}>Ton</div>
                <select value={tone} onChange={e => setTone(e.target.value)} style={sel}>
                  {['professionell', 'freundlich', 'formal', 'überzeugend'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div className="tx3" style={{ fontSize: 10, marginBottom: 4 }}>Sprache</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['DE', 'EN', 'FR', 'IT'].map(l => (
                    <button key={l} className={`btn sm ${contentLang === l ? 'primary' : ''}`} onClick={() => setContentLang(l)}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="tx3" style={{ fontSize: 10, marginBottom: 4 }}>Kontext (optional)</div>
                <textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Produkt, Käufername, Auftragsnummer…"
                  style={{ ...sel, height: 64, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, outline: 'none' }}
                />
              </div>
              <button
                className="btn primary"
                style={{ width: '100%' }}
                onClick={handleGenerate}
                disabled={!isConfigured || generating}
              >
                <Ic name="sparkle" size={13} />
                {generating ? 'Generiere…' : 'Generieren'}
              </button>
              {!isConfigured && (
                <div className="tx3" style={{ fontSize: 10.5, textAlign: 'center', marginTop: 6 }}>
                  <button className="btn sm ghost" style={{ fontSize: 10.5 }} onClick={() => onNav('settings')}>API-Key hinterlegen →</button>
                </div>
              )}
            </div>
          </div>

          {/* Text Editor */}
          <div className="card">
            <div className="card-head">
              <Ic name="doc" size={14} />
              <span className="title">{templateLabel}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                {generatedText && (
                  <button className="btn sm" onClick={() => navigator.clipboard.writeText(generatedText)}>
                    <Ic name="download" size={12} /> Kopieren
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {genError && (
                <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 5, fontSize: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                  {genError}
                </div>
              )}
              {generating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 12 }}>
                  <Ic name="sparkle" size={28} color="#a78bfa" />
                  <div className="tx2" style={{ fontSize: 12 }}>Erstelle {templateLabel}…</div>
                </div>
              ) : (
                <textarea
                  value={generatedText}
                  onChange={e => setGeneratedText(e.target.value)}
                  placeholder={`${templateLabel} wird nach Klick auf "Generieren" hier erscheinen…\n\nDer generierte Text kann direkt hier bearbeitet werden.`}
                  style={{
                    width: '100%', height: 400, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                    color: 'var(--text)', fontFamily: 'inherit', fontSize: 12.5,
                    lineHeight: 1.7, padding: 14, resize: 'vertical', boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'inspector' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Ic name="upload" size={24} color="#6366f1" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Dokument hochladen</div>
              <div className="tx2" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>PDF, Excel, Word · max 20 MB<br />Drag & Drop oder klicken</div>
              <button className="btn primary"><Ic name="upload" size={13} /> Datei wählen</button>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><Ic name="info" size={14} /><span className="title">Document Inspector</span></div>
            <div className="card-body">
              <div className="tx2" style={{ fontSize: 12, lineHeight: 1.7 }}>
                <p>Der Document Inspector analysiert hochgeladene Dokumente automatisch:</p>
                <ul style={{ paddingLeft: 16 }}>
                  <li>Vollständigkeitsprüfung nach Export-Checkliste</li>
                  <li>Ablaufdaten-Erkennung (Zertifikate, Visa, etc.)</li>
                  <li>HS-Code Validierung</li>
                  <li>Inhaltliche Plausibilitätsprüfung</li>
                  <li>Vergleich gegen Auftragsdaten</li>
                  <li>Compliance-Check EU / UK / US Importregeln</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'brief',   label: 'Briefing' },
  { id: 'risk',    label: 'Risiko-Engine' },
  { id: 'anomaly', label: 'Anomalien' },
  { id: 'forecast',label: 'Forecast' },
  { id: 'decide',  label: 'Entscheidungen' },
  { id: 'content', label: 'Content & Docs' },
];

export const IntelligenceView = ({ lang, onOpenOrder, onNav }: IntelligenceViewProps) => {
  const [tab, setTab] = useState('brief');
  const { isConfigured, activeModelObj } = useAiConfig();

  return (
    <div>
      <div className="section-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic name="sparkle" size={14} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Intelligence Hub</h1>
            <div className="sub">KI-Briefing · Risiko-Engine · Anomalien · Forecast · Entscheidungen · Content</div>
          </div>
        </div>
        <div className="right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isConfigured ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#34d399' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 6px #34d399' }} />
              {activeModelObj?.name}
            </div>
          ) : (
            <button className="btn sm" onClick={() => onNav('settings')}>
              <Ic name="settings" size={12} /> KI konfigurieren
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 2, padding: '0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', fontSize: 12.5, fontWeight: tab === t.id ? 600 : 400,
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t.id ? '#a78bfa' : 'rgba(255,255,255,0.45)',
              borderBottom: tab === t.id ? '2px solid #a78bfa' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'brief'   && <BriefingTab lang={lang} onOpenOrder={onOpenOrder} onNav={onNav} />}
      {tab === 'risk'    && <RiskEngineTab lang={lang} onOpenOrder={onOpenOrder} />}
      {tab === 'anomaly' && <AnomalyTab />}
      {tab === 'forecast'&& <ForecastTab />}
      {tab === 'decide'  && <DecisionTab onNav={onNav} />}
      {tab === 'content' && <ContentDocTab onNav={onNav} />}
    </div>
  );
};
