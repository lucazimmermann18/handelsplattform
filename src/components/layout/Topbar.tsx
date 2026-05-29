'use client';

import React, { useState } from 'react';
import { Ic } from '@/components/ui/icons';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';

interface TopbarProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  breadcrumbs: string[];
  onPalette: () => void;
  onBell: () => void;
  onCopilot: () => void;
}

function getInitials(email?: string, name?: string): string {
  if (name) return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  if (email) {
    const local = email.split('@')[0];
    const parts = local.split(/[._-]/).filter(p => p.length > 0);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase();
  }
  return 'MK';
}

function getDisplayName(email?: string, name?: string): string {
  if (name) return name;
  if (email) {
    const local = email.split('@')[0];
    return local.split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return t('de', 'user_name');
}

export const Topbar = ({ lang, setLang, theme, onThemeToggle, breadcrumbs, onPalette, onBell, onCopilot }: TopbarProps) => {
  const { user, isConfigured, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const email = user?.email;
  const initials = getInitials(email, fullName);
  const displayName = getDisplayName(email, fullName);
  const role = (user?.user_metadata?.role as string | undefined) ?? (isConfigured ? 'Member' : t(lang, 'user_role'));

  return (
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
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        onClick={onThemeToggle}
      >
        <Ic name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
      </button>
      <button
        className="iconbtn"
        title="AI Copilot · ⌘J"
        onClick={onCopilot}
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(167,139,250,0.08))', border: '1px solid rgba(167,139,250,0.2)' }}
      >
        <Ic name="sparkle" size={14} color="#c4b5fd" />
      </button>
      <button className="iconbtn" title={t(lang, 'notifications')} onClick={onBell}>
        <Ic name="bell" size={15} /><span className="dot" />
      </button>
      <button className="iconbtn" title="Help"><Ic name="help" size={15} /></button>

      {/* User menu */}
      <div style={{ position: 'relative' }}>
        <div
          className="user"
          onClick={() => setMenuOpen((o) => !o)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title={email ?? displayName}
        >
          <div className="avatar">{initials}</div>
          <div className="col" style={{ lineHeight: 1.1 }}>
            <div className="nm">{displayName}</div>
            <div className="role">{role}</div>
          </div>
          <Ic name="chevR" size={10} color="#5d667d" />
        </div>

        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)} />
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 100,
              background: 'var(--card-bg, #13151f)', border: '1px solid var(--border)',
              borderRadius: 8, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              padding: '6px 0',
            }}>
              {email && (
                <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid var(--border)' }}>
                  <div className="fw500" style={{ fontSize: 12 }}>{displayName}</div>
                  <div className="tx3" style={{ fontSize: 11 }}>{email}</div>
                </div>
              )}
              <button
                onClick={() => { setMenuOpen(false); signOut(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '9px 14px', background: 'none', border: 'none',
                  color: 'var(--text)', fontSize: 12.5, cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover, rgba(255,255,255,0.05))')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <Ic name="x" size={13} color="#f87171" />
                <span style={{ color: '#f87171' }}>{t(lang, 'logout')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
