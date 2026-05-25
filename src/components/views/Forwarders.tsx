'use client';

import React from 'react';
import type { Lang } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';

interface ForwardersViewProps { lang: Lang; }


export const ForwardersView = ({ lang: _lang }: ForwardersViewProps) => {
  return (
    <div>
      <div className="section-head">
        <h1>Spediteure</h1>
        <div className="sub">Freight Forwarder · Routen · Bewertungen</div>
        <div className="right">
          <button className="btn primary"><Ic name="plus" size={13} /> Spediteur hinzufügen</button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { l: 'Spediteure', v: '—', c: 'var(--text-2)' },
            { l: 'Aktive Buchungen', v: '—', c: '#60a5fa' },
            { l: 'Ø Bewertung', v: '—', c: '#fbbf24' },
            { l: 'Bonded Warehouse', v: '—', c: '#34d399' },
          ].map((k, i) => (
            <div key={i} className="tile kacheln" style={{ padding: 9 }}>
              <div className="tx3" style={{ fontSize: 10, textTransform: 'uppercase' }}>{k.l}</div>
              <div className="mono fw600" style={{ fontSize: 20, color: k.c, marginTop: 2 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ marginBottom: 10 }}><Ic name="ship" size={32} color="var(--text-3)" /></div>
            <div className="fw600" style={{ fontSize: 14, marginBottom: 6 }}>Noch keine Spediteure angelegt</div>
            <div className="tx3" style={{ fontSize: 12, marginBottom: 16 }}>Füge deine Freight Forwarder hinzu um Routen, Bewertungen und Buchungen zu verwalten.</div>
            <button className="btn primary"><Ic name="plus" size={13} /> Ersten Spediteur hinzufügen</button>
          </div>
        </div>
      </div>
    </div>
  );
};
