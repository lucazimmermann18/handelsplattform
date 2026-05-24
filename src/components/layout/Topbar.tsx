'use client';

import React from 'react';
import { Ic } from '@/components/ui/icons';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

interface TopbarProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  breadcrumbs: string[];
  onPalette: () => void;
  onBell: () => void;
  onCopilot: () => void;
}

export const Topbar = ({ lang, setLang, breadcrumbs, onPalette, onBell, onCopilot }: TopbarProps) => (
  <header className="topbar">
    <div className="crumbs">
      {breadcrumbs.map((b, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Ic name="chevR" size={12} color="#5d667d" />}
          <span className={i === breadcrumbs.length - 1 ? 'cur' : ''}>{b}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="spacer" />
    <div className="search" onClick={onPalette} style={{ cursor: 'pointer' }}>
      <span className="ico"><Ic name="search" size={14} /></span>
      <input placeholder={t(lang, 'search')} readOnly style={{ cursor: 'pointer' }} />
      <span className="kbd">⌘K</span>
    </div>
    <div className="lang">
      <button className={lang === 'de' ? 'on' : ''} onClick={() => setLang('de')}>DE</button>
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
    </div>
    <button
      className="iconbtn"
      title="AI Copilot · ⌘J"
      onClick={onCopilot}
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(167,139,250,0.08))', border: '1px solid rgba(167,139,250,0.2)' }}
    >
      <Ic name="sparkle" size={14} color="#c4b5fd" />
    </button>
    <button className="iconbtn" title="Benachrichtigungen" onClick={onBell}>
      <Ic name="bell" size={15} /><span className="dot" />
    </button>
    <button className="iconbtn" title="Help"><Ic name="help" size={15} /></button>
    <div className="user">
      <div className="avatar">MK</div>
      <div className="col" style={{ lineHeight: 1.1 }}>
        <div className="nm">{t(lang, 'user_name')}</div>
        <div className="role">{t(lang, 'user_role')}</div>
      </div>
    </div>
  </header>
);
