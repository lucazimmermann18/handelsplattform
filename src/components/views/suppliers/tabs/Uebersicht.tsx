'use client';

import React from 'react';
import { Badge } from '@/components/ui/primitives';
import { Ic } from '@/components/ui/icons';
import type { Supplier } from '@/lib/types';
import type { SupplierMaster } from '../types';
import { calcTrustScore, DOC_LEVEL_MAP, TRUST_LEVEL_MAP, EUDR_STATUS_MAP } from '../types';

interface TabProps { supplier: Supplier; master: SupplierMaster; onSaved: () => void; }

const ScoreRing = ({ score }: { score: number }) => {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />
        <circle
          cx="50" cy="50" r={r}
          stroke={color} strokeWidth="7" fill="none"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 50 50)"
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Geist Mono', color }}>{score}</div>
        <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trust</div>
      </div>
    </div>
  );
};

const StatusRow = ({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <Ic name={icon} size={12} color="var(--text-3)" />
    <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>{label}</span>
    {children}
  </div>
);

export const TabUebersicht = ({ supplier: s, master }: TabProps) => {
  const score = calcTrustScore(master);
  const dl = master.docLevel;
  const tl = master.trustLevel;
  const es = master.eudrStatus;
  const docInfo  = dl ? DOC_LEVEL_MAP[dl]   : null;
  const trustInfo = tl ? TRUST_LEVEL_MAP[tl] : null;
  const eudrInfo  = es ? EUDR_STATUS_MAP[es] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Trust Score + Status */}
      <div className="card">
        <div className="card-head">
          <Ic name="star" size={14} />
          <span className="title">Trust & Compliance Score</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <ScoreRing score={score} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <StatusRow icon="map" label="GPS-Verifizierung">
                {master.gpsVerified
                  ? <Badge kind="success" dot>Verifiziert</Badge>
                  : <Badge kind="neutral" dot>Ausstehend</Badge>}
              </StatusRow>
              <StatusRow icon="doc" label="Dokumentenstatus">
                {docInfo ? <Badge kind={docInfo.kind}>{docInfo.label}</Badge> : <Badge kind="neutral">Nicht gepflegt</Badge>}
              </StatusRow>
              <StatusRow icon="shield" label="EUDR-Status">
                {eudrInfo ? <Badge kind={eudrInfo.kind}>{eudrInfo.label}</Badge> : <Badge kind="neutral">Nicht geprüft</Badge>}
              </StatusRow>
              <StatusRow icon="star" label="Vertrauensstufe">
                {trustInfo ? <Badge kind={trustInfo.kind}>{trustInfo.label}</Badge> : <Badge kind="neutral">Neu / Unbekannt</Badge>}
              </StatusRow>
              <StatusRow icon="finance" label="Bank & Registrierung">
                {master.bankVerified && master.taxIdVerified
                  ? <Badge kind="success">Vollständig</Badge>
                  : master.bankVerified
                  ? <Badge kind="warning">Bank ✓ · Steuer ausstehend</Badge>
                  : <Badge kind="neutral">Ausstehend</Badge>}
              </StatusRow>
            </div>
          </div>
          {docInfo && (
            <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11.5, color: 'var(--text-3)' }}>
              <strong style={{ color: 'var(--text-2)' }}>Dokumenten-Level:</strong> {docInfo.desc}
            </div>
          )}
        </div>
      </div>

      {/* Kontakt & Stammdaten */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card">
          <div className="card-head"><Ic name="info" size={14} /><span className="title">Kontakt</span></div>
          <div className="card-body">
            <div className="fields">
              <div className="l">Ansprechpartner</div><div className="v fw500">{s.contact || '—'}</div>
              {s.phone && (<><div className="l">Telefon</div><div className="v mono">{s.phone}</div></>)}
              {s.email && (<><div className="l">E-Mail</div><div className="v mono" style={{ fontSize: 11 }}>{s.email}</div></>)}
              {s.whatsapp && (<><div className="l">WhatsApp</div><div className="v mono">{s.whatsapp}</div></>)}
              {master.preferredContactTime && (<><div className="l">Beste Kontaktzeit</div><div className="v">{master.preferredContactTime}</div></>)}
              <div className="l">Sprachen</div><div className="v">{master.languages || s.language || 'sw / en'}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><Ic name="leaf" size={14} /><span className="title">Partner-Info</span></div>
          <div className="card-body">
            <div className="fields">
              <div className="l">Typ</div><div className="v">{s.type}</div>
              <div className="l">Standort</div><div className="v">{s.city}, {s.region}, {s.country}</div>
              <div className="l">Kapazität</div><div className="v mono">{s.capacity || '—'}</div>
              {master.partnerSince && (<><div className="l">Partner seit</div><div className="v mono">{master.partnerSince}</div></>)}
              {master.visitFrequency && (<><div className="l">Besuchsfrequenz</div><div className="v">{master.visitFrequency}</div></>)}
              {master.lastVisitDate && (<><div className="l">Letzter Besuch</div><div className="v mono">{master.lastVisitDate}</div></>)}
            </div>
          </div>
        </div>
      </div>

      {/* Farm-Highlights */}
      {(master.farmSize || master.annualCapacity || master.harvestSeason || master.crops) && (
        <div className="card">
          <div className="card-head"><Ic name="map" size={14} /><span className="title">Farm-Highlights</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {master.farmSize && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div className="mono fw600" style={{ fontSize: 16, color: '#34d399' }}>{master.farmSize}</div>
                  <div className="tx3" style={{ fontSize: 10 }}>Farmgröße</div>
                </div>
              )}
              {master.plotCount && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div className="mono fw600" style={{ fontSize: 16, color: '#60a5fa' }}>{master.plotCount}</div>
                  <div className="tx3" style={{ fontSize: 10 }}>Plots</div>
                </div>
              )}
              {master.employees && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div className="mono fw600" style={{ fontSize: 16, color: '#a78bfa' }}>{master.employees}</div>
                  <div className="tx3" style={{ fontSize: 10 }}>Mitarbeiter</div>
                </div>
              )}
              {master.annualCapacity && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div className="mono fw600" style={{ fontSize: 16, color: '#fbbf24' }}>{master.annualCapacity}</div>
                  <div className="tx3" style={{ fontSize: 10 }}>Jahreskapazität</div>
                </div>
              )}
            </div>
            {(master.crops || master.harvestSeason) && (
              <div className="fields" style={{ marginTop: 8 }}>
                {master.crops && (<><div className="l">Produkte / Sorten</div><div className="v">{master.crops}</div></>)}
                {master.harvestSeason && (<><div className="l">Erntezeiten</div><div className="v">{master.harvestSeason}</div></>)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GPS Quick-Info */}
      {(master.gpsLat && master.gpsLon) && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ic name="map" size={13} color="#34d399" />
          <span className="mono" style={{ fontSize: 12 }}>{master.gpsLat}, {master.gpsLon}</span>
          {master.gpsVerified && <Badge kind="success">GPS verifiziert</Badge>}
          {master.gpsVerifiedDate && <span className="tx3" style={{ fontSize: 11 }}>· {master.gpsVerifiedDate}</span>}
          <a
            href={`https://www.google.com/maps?q=${master.gpsLat},${master.gpsLon}`}
            target="_blank" rel="noopener noreferrer"
            className="btn sm ghost"
            style={{ textDecoration: 'none', marginLeft: 'auto', fontSize: 11 }}
          >
            <Ic name="map" size={11} /> Google Maps
          </a>
        </div>
      )}
    </div>
  );
};
