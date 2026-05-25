'use client';

import React from 'react';
import { MOCK } from '@/lib/mock';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge } from '@/components/ui/primitives';

// ────────────────────────────────────────────────────────────
// Complaints List
// ────────────────────────────────────────────────────────────

interface ComplaintsListProps {
  lang: Lang;
  onOpen: (id: string) => void;
}

const SEV_KIND: Record<string, string> = { kritisch: 'danger', mittel: 'warning', gering: 'info' };
const STATUS_META: Record<string, { kind: string }> = {
  'in Bearbeitung': { kind: 'warning' },
  'gelöst':         { kind: 'success' },
  'geschlossen':    { kind: 'neutral' },
};

export const ComplaintsList = ({ lang, onOpen }: ComplaintsListProps) => {
  const M = MOCK;
  const open = M.complaints.filter(c => c.status !== 'geschlossen').length;

  const kpis = [
    { l: 'Offen',          v: open,                                                         c: '#f87171' },
    { l: 'In Bearbeitung', v: M.complaints.filter(c => c.status === 'in Bearbeitung').length, c: '#fbbf24' },
    { l: 'Gelöst',         v: M.complaints.filter(c => c.status === 'gelöst').length,         c: '#34d399' },
    { l: 'Kritisch',       v: M.complaints.filter(c => c.sev === 'kritisch').length,          c: '#f87171' },
    { l: 'Fälle gesamt',   v: M.complaints.length,                                            c: 'var(--text-2)' },
  ];

  return (
    <div>
      <div className="section-head">
        <h1>{t(lang, 'nav_complaints')}</h1>
        <div className="sub">{M.complaints.length} Fälle · {open} offen</div>
        <div className="right">
          <button className="btn primary"><Ic name="plus" size={13} /> Neuer Fall</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
          {kpis.map((k, i) => (
            <div key={i} className="tile kacheln" style={{ padding: 9 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 20, color: k.c, marginTop: 2 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Fall</th>
                <th>Auftrag · Käufer</th>
                <th>Kategorie</th>
                <th>Beschreibung</th>
                <th>Schwere</th>
                <th>Verantwortlich</th>
                <th>Eröffnet</th>
                <th>Kostenwirkung</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {M.complaints.map(c => {
                const b = M.buyers.find(x => x.id === c.buyer);
                const isCritical = c.sev === 'kritisch' && c.status !== 'geschlossen';
                const meta = STATUS_META[c.status];
                return (
                  <tr
                    key={c.id}
                    style={{ cursor: 'pointer', background: isCritical ? 'rgba(248,113,113,0.04)' : undefined }}
                    onClick={() => onOpen(c.id)}
                  >
                    <td><span className="id fw500">{c.id}</span></td>
                    <td>
                      <div className="mono" style={{ fontSize: 11 }}>{c.order}</div>
                      <div className="tx3" style={{ fontSize: 10.5 }}>{b?.name?.split(' ').slice(0, 3).join(' ')}</div>
                    </td>
                    <td><Badge kind="neutral">{c.cat}</Badge></td>
                    <td className="tx2" style={{ fontSize: 12, maxWidth: 260 }}>{c.t}</td>
                    <td>
                      <Badge kind={SEV_KIND[c.sev] ?? 'neutral'} dot>{c.sev}</Badge>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.owner}</td>
                    <td className="mono tx2" style={{ fontSize: 11 }}>{fmtDate(c.opened)}</td>
                    <td className="mono fw500" style={{ fontSize: 12, color: '#f87171' }}>{c.impact}</td>
                    <td>
                      {meta && <Badge kind={meta.kind} dot>{c.status}</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Complaint Detail
// ────────────────────────────────────────────────────────────

interface ComplaintDetailProps {
  id: string;
  lang: Lang;
  onBack: () => void;
}

export const ComplaintDetail = ({ id, lang, onBack }: ComplaintDetailProps) => {
  const M = MOCK;
  const c = M.complaints.find(x => x.id === id) ?? M.complaints[0];
  const order = M.orders.find(o => o.id === c.order);
  const buyer = M.buyers.find(b => b.id === c.buyer);

  const timeline = [
    { text: 'Fall eröffnet',                    meta: `${c.owner} · ${fmtDate(c.opened)}`,                    s: 'done'   },
    { text: 'Lieferant kontaktiert',             meta: 'WhatsApp + E-Mail · vor 3 Tagen',                      s: 'done'   },
    { text: 'Vor-Ort-Inspektion angefordert',    meta: 'Bureau Veritas · ETA Inspekteur vor 2 Tagen',          s: 'done'   },
    { text: 'Antwort Lieferant erhalten',        meta: 'EU-Vet-Approval wird beantragt · ETA 8 Wochen',        s: 'done'   },
    { text: 'Alternative Beschaffung prüfen',    meta: 'Kenya Source-Optionen · läuft',                        s: 'active' },
    { text: 'Käufer-Lösung verhandeln',          meta: 'Ersatz Charge oder Stornierung',                       s: 'future' },
    { text: 'Fall abschließen',                  meta: '',                                                      s: 'future' },
  ];

  const evidence = [
    { lbl: 'EU Vet Cert · fehlend',   tag: 'doc'  },
    { lbl: 'Iringa Slaughterhouse',   tag: 'foto' },
    { lbl: 'Kühlkette Log',           tag: 'doc'  },
    { lbl: 'Container Inspect.',      tag: 'foto' },
    { lbl: 'TRACES Screenshot',       tag: 'doc'  },
    { lbl: 'Korrespondenz',           tag: 'mail' },
  ];

  return (
    <div>
      <div className="section-head">
        <button className="btn ghost" onClick={onBack} style={{ padding: 4 }}>
          <Ic name="chevL" size={14} /> {t(lang, 'back')}
        </button>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 17, margin: 0 }}>{c.id}</h1>
        <Badge kind={SEV_KIND[c.sev] ?? 'neutral'} dot>{c.sev}</Badge>
        <div className="tx2" style={{ fontSize: 13 }}>{c.t}</div>
        <div className="right">
          <button className="btn"><Ic name="mail" size={13} /> Käufer informieren</button>
          <button className="btn primary"><Ic name="task" size={13} /> Lösung dokumentieren</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* ── LEFT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Fall-Übersicht */}
          <div className="card">
            <div className="card-head"><Ic name="bug" size={14} /><span className="title">Fall-Übersicht</span></div>
            <div className="card-body">
              <div className="fields">
                <div className="l">Auftrag</div><div className="v mono">{c.order}</div>
                <div className="l">Käufer</div><div className="v">{buyer?.name}</div>
                <div className="l">Produkt</div><div className="v">{order?.productVariant ?? '—'}</div>
                <div className="l">Charge</div><div className="v mono">{order?.batch ?? '—'}</div>
                <div className="l">Kategorie</div><div className="v"><Badge kind="neutral">{c.cat}</Badge></div>
                <div className="l">Schweregrad</div><div className="v"><Badge kind={SEV_KIND[c.sev] ?? 'neutral'} dot>{c.sev}</Badge></div>
                <div className="l">Verantwortlich</div><div className="v">{c.owner}</div>
                <div className="l">Eröffnet</div><div className="v mono">{fmtDate(c.opened)}</div>
                <div className="l">Kostenwirkung</div><div className="v mono fw500" style={{ color: '#f87171' }}>{c.impact}</div>
              </div>
            </div>
          </div>

          {/* Maßnahmen-Timeline */}
          <div className="card">
            <div className="card-head"><Ic name="activity" size={14} /><span className="title">Maßnahmen-Historie</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="timeline" style={{ padding: 14 }}>
                {timeline.map((e, i) => (
                  <div key={i} className={`ev ${e.s}`}>
                    <div className="t">{e.text}</div>
                    {e.meta && <div className="m">{e.meta}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Beweismittel */}
          <div className="card">
            <div className="card-head"><Ic name="upload" size={14} /><span className="title">Foto-Doku &amp; Beweismittel</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {evidence.map((p, i) => (
                  <div key={i} style={{ aspectRatio: '1', background: 'repeating-linear-gradient(45deg, #131927, #131927 6px, #0e131f 6px, #0e131f 12px)', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)', cursor: 'pointer' }}>
                    <Badge kind="neutral">{p.tag}</Badge>
                    <div className="tx3 mono" style={{ fontSize: 9.5 }}>{p.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* AI Root Cause */}
          <div className="ai-card">
            <div className="head">
              <span className="pill">AI</span>
              <span className="fw600" style={{ fontSize: 12 }}>Root Cause Analyse</span>
            </div>
            <div className="tx2" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
              Hauptursache: <span className="fw500" style={{ color: '#e6eaf2' }}>EU-Vet-Approval beim Lieferanten nie vollständig erlangt</span>. Auftrag wurde unter falscher Annahme angenommen.
              <br /><br />
              Empfehlungen:<br />
              <span style={{ display: 'block', marginTop: 4, paddingLeft: 8, borderLeft: '2px solid rgba(167,139,250,0.3)' }}>
                • Lieferant aus aktiver Liste nehmen bis EU-Listung<br />
                • Käufer: Ersatz aus alternativer Quelle prüfen<br />
                • Internes SOP: Vet-Approval als Hard-Gate beim Onboarding<br />
                • Reklamations-Reserve: 8% des Auftragswerts buchen
              </span>
            </div>
          </div>

          {/* Kostenwirkung */}
          <div className="card">
            <div className="card-head"><Ic name="finance" size={14} /><span className="title">Kostenwirkung</span></div>
            <div className="card-body">
              <div className="fields">
                <div className="l">Blockierter Umsatz</div>
                <div className="v mono fw500" style={{ color: '#f87171' }}>{c.impact}</div>
                <div className="l">Verlorene Marge</div>
                <div className="v mono">est. ~18%</div>
                <div className="l">Storno-Kosten</div>
                <div className="v mono">3.400 €</div>
                <div className="l">Versicherung</div>
                <div className="v mono" style={{ color: '#34d399' }}>−12.000 € (möglich)</div>
                <div className="l">Lieferanten-Belastung</div>
                <div className="v">prüfen</div>
              </div>
            </div>
          </div>

          {/* Weitere Fälle */}
          <div className="card">
            <div className="card-head"><Ic name="layers" size={14} /><span className="title">Weitere Fälle</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              {M.complaints.filter(cc => cc.id !== c.id).map(cc => (
                <div key={cc.id} className="row" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <span className="id" style={{ fontSize: 11 }}>{cc.id}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5 }}>{cc.t}</div>
                    <div className="tx3" style={{ fontSize: 10 }}>{cc.cat}</div>
                  </div>
                  <Badge kind={cc.status === 'gelöst' ? 'success' : cc.status === 'in Bearbeitung' ? 'warning' : 'neutral'} dot>
                    {cc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
