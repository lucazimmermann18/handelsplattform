'use client';

import React from 'react';
import type { Lang } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { Ic } from '@/components/ui/icons';
import { Badge, Stars } from '@/components/ui/primitives';

interface ForwardersViewProps { lang: Lang; }

const forwarders = [
  { name: 'Kühne+Nagel TZ', routes: 'DAR→EU all', rating: 4.6, transitDays: '28-32', priceIdx: 'mid', services: ['LCL', 'FCL', 'Reefer', 'Customs'], lastBooking: '2026-05-22', activeBookings: 3, bondedWH: true },
  { name: 'Maersk Spot', routes: 'DAR→HAM/RTM/ANR', rating: 4.4, transitDays: '32-35', priceIdx: 'low', services: ['FCL', 'Reefer', 'Booking API'], lastBooking: '2026-05-23', activeBookings: 2, bondedWH: false },
  { name: 'CMA CGM Tanzania', routes: 'DAR→Med', rating: 4.3, transitDays: '21-24', priceIdx: 'mid', services: ['FCL', 'Reefer'], lastBooking: '2026-05-19', activeBookings: 1, bondedWH: false },
  { name: 'DHL Global Forwarding', routes: 'NBO/MOM→EU', rating: 4.7, transitDays: '24-28', priceIdx: 'high', services: ['Air', 'LCL', 'FCL', 'Customs', 'Reefer'], lastBooking: '2026-05-18', activeBookings: 2, bondedWH: true },
  { name: 'MSC Tanzania', routes: 'DAR→EU all', rating: 4.1, transitDays: '30-34', priceIdx: 'low', services: ['FCL', 'Reefer'], lastBooking: '2026-05-15', activeBookings: 1, bondedWH: false },
  { name: 'Bollore Logistics', routes: 'DAR/MOM→FR/IT', rating: 4.0, transitDays: '27-30', priceIdx: 'mid', services: ['FCL', 'Customs', 'Inland'], lastBooking: '2026-04-29', activeBookings: 0, bondedWH: true },
];

const priceLabel: Record<string, string> = { low: '€', mid: '€€', high: '€€€' };
const priceKind: Record<string, string> = { low: 'success', mid: 'info', high: 'warning' };

export const ForwardersView = ({ lang }: ForwardersViewProps) => {
  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h1 className="view-title">Spediteure</h1>
          <p className="view-sub">Freight Forwarder · Routen · Bewertungen</p>
        </div>
        <button className="btn-primary"><Ic name="plus" size={14} /> Spediteur hinzufügen</button>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="ship" size={18} /></div>
          <div className="kpi-val">{forwarders.length}</div>
          <div className="kpi-lbl">Spediteure</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="box" size={18} /></div>
          <div className="kpi-val">{forwarders.reduce((s, f) => s + f.activeBookings, 0)}</div>
          <div className="kpi-lbl">Aktive Buchungen</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="star" size={18} /></div>
          <div className="kpi-val">{(forwarders.reduce((s, f) => s + f.rating, 0) / forwarders.length).toFixed(1)}</div>
          <div className="kpi-lbl">Ø Bewertung</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Ic name="inv" size={18} /></div>
          <div className="kpi-val">{forwarders.filter(f => f.bondedWH).length}</div>
          <div className="kpi-lbl">Bonded Warehouse</div>
        </div>
      </div>

      {/* 2-column card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {forwarders.map(fw => (
          <div key={fw.name} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Ic name="ship" size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{fw.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fw.routes}</div>
                <Stars value={Math.round(fw.rating)} />
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-muted)' }}>
                {fw.rating.toFixed(1)}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Transit</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fw.transitDays}d</div>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Preisniveau</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{priceLabel[fw.priceIdx]}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Aktive Buchungen</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fw.activeBookings}</div>
              </div>
            </div>

            {/* Services */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {fw.services.map(svc => (
                <Badge key={svc} kind="neutral">{svc}</Badge>
              ))}
              {fw.bondedWH && <Badge kind="info">Bonded WH</Badge>}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Letzte Buchung: {fmtDate(fw.lastBooking)}
              </div>
              <button className="btn-ghost" style={{ fontSize: 12 }}>
                Quote anfragen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
