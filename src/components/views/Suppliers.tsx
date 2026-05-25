'use client';

import React, { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate, fmtNum } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars, BarChart, StatusBadge } from '@/components/ui/primitives';

// --- Suppliers List ---

interface SuppliersListProps {
  lang: Lang;
  onOpen: (id: string) => void;
}

export const SuppliersList = ({ lang, onOpen }: SuppliersListProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;

  const kpis = [
    { l: 'Aktiv', v: M.suppliers.filter(s => s.status === 'aktiv').length, c: '#34d399' },
    { l: 'In Prüfung', v: M.suppliers.filter(s => s.status === 'in Prüfung').length, c: '#fbbf24' },
    { l: 'Tier A', v: M.suppliers.filter(s => s.tier === 'A').length, c: '#60a5fa' },
    { l: 'Ø Score', v: (M.suppliers.reduce((s, x) => s + x.score, 0) / M.suppliers.length).toFixed(1), c: '#a78bfa' },
    { l: 'Hochrisiko', v: M.suppliers.filter(s => s.risk === 'hoch').length, c: '#f87171' },
  ];

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_suppliers')}</h1>
        <div className="sub">{M.suppliers.length} Lieferanten · 3 Länder · {M.suppliers.filter(s => s.tier === 'A').length} Tier-A</div>
        <div className="right">
          <button className="btn"><Ic name="map" size={13} /> Karte</button>
          <button className="btn"><Ic name="download" size={13} /> {t(lang, 'export')}</button>
          <button className="btn primary"><Ic name="plus" size={13} /> Neuer Lieferant</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="tile kacheln" style={{ padding: 9 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 18, color: k.c, marginTop: 2 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Lieferant</th>
                <th>Typ · Region</th>
                <th>Produkte</th>
                <th>Score</th>
                <th>Kapazität</th>
                <th>Zertifikate</th>
                <th>Letzte Lieferung</th>
                <th>Risiko</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {M.suppliers.map(s => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(s.id)}>
                  <td>
                    <div className="fw500">{s.name}</div>
                    <div className="tx3 mono" style={{ fontSize: 10 }}>{s.id} · {s.contact}</div>
                  </td>
                  <td>
                    <div>{s.type}</div>
                    <div className="tx3" style={{ fontSize: 10.5 }}>{s.region}, {s.country}</div>
                  </td>
                  <td>
                    <div className="tx2" style={{ fontSize: 11.5 }}>
                      {s.products.slice(0, 2).join(', ')}{s.products.length > 2 ? ` +${s.products.length - 2}` : ''}
                    </div>
                  </td>
                  <td>
                    <div className="row"><Stars value={Math.round(s.score)} /></div>
                    <div className="tx3 mono" style={{ fontSize: 10 }}>{s.score.toFixed(1)} · Tier {s.tier}</div>
                  </td>
                  <td className="mono tx2" style={{ fontSize: 11 }}>{s.capacity}</td>
                  <td>
                    <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                      {s.certs.slice(0, 2).map((c, i) => (
                        <Badge key={i} kind={c.includes('pending') ? 'warning' : 'success'}>{c.split(' ')[0]}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(s.lastDelivery)}</td>
                  <td>
                    <Badge kind={s.risk === 'niedrig' ? 'success' : s.risk === 'mittel' ? 'warning' : 'danger'} dot>
                      {s.risk}
                    </Badge>
                  </td>
                  <td>
                    <Badge kind={s.status === 'aktiv' ? 'success' : 'warning'} dot>{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Supplier Detail ---

interface SupplierDetailProps {
  id: string;
  lang: Lang;
  onBack: () => void;
}

export const SupplierDetail = ({ id, lang, onBack }: SupplierDetailProps) => {
  const { data: M } = useData();
  if (!M) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Laden…</div>;
  const s = M.suppliers.find(x => x.id === id);
  if (!s) return <div className="empty">Lieferant nicht gefunden</div>;

  const orders = M.orders.filter(o => o.supplierId === s.id);

  // Deterministic price history based on supplier id hash
  const seed = s.id.charCodeAt(s.id.length - 1);
  const priceHistory = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      m: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i],
      v: parseFloat((4 + Math.sin(i / 2 + seed * 0.1) * 0.4 + (((seed * (i + 1) * 17) % 100) / 500)).toFixed(2)),
    })),
    [seed]
  );

  const circumference = 2 * Math.PI * 38;
  const scoreDash = (s.score / 5) * circumference;

  return (
    <div>
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
          <Ic name="chevL" size={14} /> {t(lang, 'back')}
        </button>
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: 'linear-gradient(135deg, #1a2540, #0e1828)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, color: '#60a5fa', fontFamily: 'Geist Mono',
        }}>
          {s.country.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18 }}>{s.name}</h1>
          <div className="tx3" style={{ fontSize: 12 }}>{s.id} · {s.type} · {s.region}, {s.country}</div>
        </div>
        <Badge kind="success" dot>{s.status}</Badge>
        <Badge kind={s.risk === 'niedrig' ? 'success' : s.risk === 'mittel' ? 'warning' : 'danger'}>
          Risiko {s.risk}
        </Badge>
        <div className="right">
          <button className="btn"><Ic name="map" size={13} /> Auf Karte</button>
          <button className="btn"><Ic name="phone" size={13} /> Anrufen</button>
          <button className="btn primary"><Ic name="edit" size={13} /> Bearbeiten</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* ---- LEFT COLUMN ---- */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Farm Map */}
          <div className="card">
            <div className="card-head">
              <Ic name="map" size={14} />
              <span className="title">Standort &amp; Farm-Karte</span>
              <span className="meta">GPS · EUDR-konform</span>
            </div>
            <div style={{ height: 260, position: 'relative', background: 'radial-gradient(ellipse at 60% 40%, #0b1320 0%, #06090f 100%)', overflow: 'hidden' }}>
              <svg viewBox="0 0 600 260" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <pattern id="topo" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0,20 Q10,15 20,20 T40,20" fill="none" stroke="rgba(34,197,94,0.04)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="600" height="260" fill="url(#topo)" />
                {/* River */}
                <path d="M50,200 Q150,180 250,200 T450,200 L600,210 L600,260 L0,260 L0,210 Z" fill="rgba(34,211,238,0.06)" />
                <path d="M100,80 Q200,100 300,80 T500,100" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="1.5" strokeLinecap="round" />
                <text x="430" y="92" fill="#22d3ee" fontFamily="Geist Mono" fontSize="9">Pangani River</text>
                {/* Road */}
                <path d="M0,130 Q200,140 400,130 L600,130" fill="none" stroke="rgba(245,158,11,0.18)" strokeWidth="1" strokeDasharray="3 3" />
                <text x="100" y="125" fill="#f59e0b" fontFamily="Geist Mono" fontSize="8">B144 · Arusha–Moshi</text>
                {/* Farm plots */}
                {[
                  { x: 220, y: 110, label: 'Plot A · 12.4 ha · Arabica', score: 'A' },
                  { x: 290, y: 140, label: 'Plot B · 8.2 ha · Macadamia', score: 'A' },
                  { x: 340, y: 105, label: 'Plot C · 6.1 ha · Arabica', score: 'B' },
                  { x: 380, y: 150, label: 'Plot D · 4.8 ha · Mixed', score: 'A' },
                ].map((f, i) => (
                  <g key={i}>
                    <rect x={f.x - 18} y={f.y - 12} width="36" height="24" fill="rgba(52,211,153,0.18)" stroke="#34d399" strokeWidth="0.8" rx="2" />
                    <text x={f.x} y={f.y - 16} fill="#34d399" fontFamily="Geist Mono" fontSize="8" textAnchor="middle">{f.label}</text>
                  </g>
                ))}
                {/* HQ pin */}
                <g transform="translate(290, 130)">
                  <circle r="14" fill="rgba(59,130,246,0.2)" />
                  <circle r="6" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                  <text y="-20" fill="white" fontFamily="Geist" fontSize="10" fontWeight="600" textAnchor="middle">{s.name.split(' ')[0]} HQ</text>
                  <text y="26" fill="#8893a8" fontFamily="Geist Mono" fontSize="8" textAnchor="middle">-3.3869, 36.6830</text>
                </g>
                {/* Compass */}
                <g transform="translate(560, 30)">
                  <text x="0" y="0" fill="#5d667d" fontFamily="Geist Mono" fontSize="9" textAnchor="middle">N</text>
                  <line x1="0" y1="3" x2="0" y2="14" stroke="#5d667d" />
                  <path d="M-3,13 L0,3 L3,13 Z" fill="#5d667d" />
                </g>
              </svg>
              <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(8,14,24,0.8)', backdropFilter: 'blur(8px)', padding: 8, borderRadius: 4, fontSize: 10, fontFamily: 'Geist Mono', color: '#34d399' }}>
                <div className="row"><span className="dot" style={{ background: '#34d399' }} />4 Farm-Plots · 31.5 ha</div>
                <div className="row" style={{ marginTop: 2 }}><span className="dot" style={{ background: '#3b82f6' }} />GPS verifiziert · 12.05.2026</div>
              </div>
              <div style={{ position: 'absolute', right: 12, top: 12, background: 'rgba(8,14,24,0.8)', backdropFilter: 'blur(8px)', padding: '6px 9px', borderRadius: 4, fontSize: 10, fontFamily: 'Geist Mono', color: '#22d3ee' }}>
                <span style={{ color: '#22d3ee' }}>● LIVE</span> Satelliten-Imagery · Sentinel-2
              </div>
            </div>
          </div>

          {/* Price History */}
          <div className="card">
            <div className="card-head">
              <Ic name="chart" size={14} />
              <span className="title">Einkaufspreis-Verlauf · 12 Monate</span>
              <div style={{ marginLeft: 'auto' }} className="row">
                <Badge kind="info">EK €/kg</Badge>
                <span className="tx3 mono" style={{ fontSize: 11 }}>Ø 4,18 €/kg · ±6%</span>
              </div>
            </div>
            <div className="card-body">
              <BarChart data={priceHistory} w={680} h={130} color="#3b82f6" lblKey="m" valKey="v" />
            </div>
          </div>

          {/* Order History */}
          <div className="card">
            <div className="card-head">
              <Ic name="history" size={14} />
              <span className="title">Lieferhistorie</span>
              <span className="meta">{orders.length} Aufträge</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Produkt</th>
                  <th className="num">Menge</th>
                  <th>Charge</th>
                  <th>QC</th>
                  <th>Status</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="empty">Keine Aufträge bisher</td></tr>
                )}
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><span className="id">{o.id}</span></td>
                    <td>{o.productVariant}</td>
                    <td className="num">{fmtNum(o.qty)} {o.unit}</td>
                    <td className="mono">{o.batch}</td>
                    <td><Badge kind="success" dot>Pass</Badge></td>
                    <td><StatusBadge s={o.status} lang={lang} /></td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(o.created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Communication */}
          <div className="card">
            <div className="card-head">
              <Ic name="mail" size={14} />
              <span className="title">Kommunikation &amp; Notizen</span>
              <div style={{ marginLeft: 'auto' }}>
                <button className="btn sm"><Ic name="plus" size={11} /> Notiz</button>
              </div>
            </div>
            <div>
              {[
                { who: 'M. Kassim', what: 'Telefon', when: 'vor 2 Tagen', body: 'Bestätigt Erntefenster Cashew Mtwara: 15. Oktober – 15. Januar. Erwartete Erntemenge: 140t.' },
                { who: 'N. Otieno', what: 'Field Visit', when: 'vor 3 Wochen', body: 'Lagerhaus inspiziert. Trocknungsanlage in Top-Zustand. 3 neue Wiegeskalen installiert. Foto-Doku: 12 Bilder.' },
                { who: s.contact, what: 'WhatsApp', when: 'vor 4 Wochen', body: 'Preisanpassung gewünscht: +4% wegen FX. Wir können bei 4,35 €/kg liefern, wenn Abnahme >40t.' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <span className="fw500" style={{ fontSize: 12 }}>{m.who}</span>
                    <span className="tx3" style={{ fontSize: 11 }}>· {m.what}</span>
                    <span className="tx3 mono" style={{ marginLeft: 'auto', fontSize: 10.5 }}>{m.when}</span>
                  </div>
                  <div className="tx2" style={{ fontSize: 11.5 }}>{m.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---- RIGHT COLUMN ---- */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Scoring Ring */}
          <div className="card">
            <div className="card-head"><Ic name="star" size={14} /><span className="title">Scoring</span></div>
            <div className="card-body">
              <div className="row" style={{ marginBottom: 10 }}>
                <div className="risk-ring">
                  <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
                    <circle
                      cx="45" cy="45" r="38"
                      stroke="#34d399" strokeWidth="6" fill="none"
                      strokeDasharray={`${scoreDash} ${circumference}`}
                      transform="rotate(-90 45 45)"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="v">
                    <div className="num">{s.score.toFixed(1)}</div>
                    <div className="lbl">SCORE</div>
                  </div>
                </div>
                <div style={{ flex: 1, marginLeft: 16 }}>
                  <div className="row tx2" style={{ marginBottom: 3 }}><span style={{ flex: 1, fontSize: 11.5 }}>Qualität</span><Stars value={s.qual} /></div>
                  <div className="row tx2" style={{ marginBottom: 3 }}><span style={{ flex: 1, fontSize: 11.5 }}>Lieferzuverlässigkeit</span><Stars value={s.rel} /></div>
                  <div className="row tx2" style={{ marginBottom: 3 }}><span style={{ flex: 1, fontSize: 11.5 }}>Kommunikation</span><Stars value={s.comm} /></div>
                  <div className="row tx2" style={{ marginBottom: 3 }}><span style={{ flex: 1, fontSize: 11.5 }}>Preisstabilität</span><Stars value={s.price} /></div>
                  <div className="row tx2"><span style={{ flex: 1, fontSize: 11.5 }}>Dokumentation</span><Stars value={s.docs} /></div>
                </div>
              </div>
              <div className="sep" />
              <div className="row" style={{ fontSize: 11.5, marginBottom: 6 }}>
                <span className="tx3">Tier</span>
                <Badge kind="success">Tier {s.tier}</Badge>
              </div>
              <div className="row" style={{ fontSize: 11.5, marginBottom: 6 }}>
                <span className="tx3">Compliance-Risiko</span>
                <Badge kind={s.risk === 'niedrig' ? 'success' : s.risk === 'mittel' ? 'warning' : 'danger'} dot>{s.risk}</Badge>
              </div>
              <div className="row" style={{ fontSize: 11.5 }}>
                <span className="tx3">Aktiv seit</span>
                <span className="mono">2022-09</span>
              </div>
            </div>
          </div>

          {/* Stammdaten */}
          <div className="card">
            <div className="card-head"><Ic name="info" size={14} /><span className="title">Stammdaten</span></div>
            <div className="card-body">
              <div className="fields">
                <div className="l">Ansprechpartner</div><div className="v">{s.contact}</div>
                <div className="l">Telefon</div><div className="v mono">{s.phone}</div>
                <div className="l">E-Mail</div><div className="v mono" style={{ fontSize: 11 }}>{s.email}</div>
                {s.whatsapp && <><div className="l">WhatsApp</div><div className="v mono">{s.whatsapp}</div></>}
                <div className="l">Sprachen</div><div className="v">{s.language || 'sw / en'}</div>
                <div className="l">Kapazität</div><div className="v mono">{s.capacity}</div>
                <div className="l">Bankdaten</div><div className="v"><Badge kind="success">verifiziert</Badge></div>
                <div className="l">Steuer-ID</div><div className="v mono">TZ-TIN-2247-{s.id.slice(-3)}</div>
                <div className="l">Registrierung</div><div className="v mono">BRELA #{(seed * 7 + 100000) % 999999}</div>
              </div>
            </div>
          </div>

          {/* Zertifikate */}
          <div className="card">
            <div className="card-head">
              <Ic name="leaf" size={14} />
              <span className="title">Zertifikate</span>
              <span className="meta">{s.certs.length}</span>
            </div>
            <div className="card-body">
              {s.certs.map((c, i) => (
                <div key={i} className="row" style={{ padding: '7px 0', borderBottom: i < s.certs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Ic name="leaf" size={12} color="#34d399" />
                  <div style={{ flex: 1 }}>
                    <div className="fw500" style={{ fontSize: 12 }}>{c}</div>
                    <div className="tx3 mono" style={{ fontSize: 10 }}>gültig bis {2027 - i}-04-{20 - i}</div>
                  </div>
                  <Badge kind={c.includes('pending') ? 'warning' : 'success'} dot>
                    {c.includes('pending') ? 'pending' : 'gültig'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Field Visits */}
          <div className="card">
            <div className="card-head">
              <Ic name="pin" size={14} />
              <span className="title">Field Visits &amp; Audits</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {[
                { d: 'Mai 2026', t: 'Q2 Audit', who: 'N. Otieno', r: 'A' },
                { d: 'Feb 2026', t: 'Hygiene-Inspektion', who: 'M. Kassim', r: 'A' },
                { d: 'Nov 2025', t: 'Erntebesuch', who: 'M. Kassim', r: 'B' },
                { d: 'Aug 2025', t: 'Initial Audit', who: 'External: BV', r: 'A' },
              ].map((f, i) => (
                <div key={i} className="row" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <span className="mono tx3" style={{ width: 60, fontSize: 10.5 }}>{f.d}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12 }} className="fw500">{f.t}</div>
                    <div className="tx3" style={{ fontSize: 10.5 }}>{f.who}</div>
                  </div>
                  <Badge kind={f.r === 'A' ? 'success' : 'warning'}>{f.r}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
