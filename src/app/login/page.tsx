'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'E-Mail oder Passwort falsch.'
          : authError.message
        );
        setLoading(false);
      } else {
        router.push(next);
        router.refresh();
      }
    } catch {
      setError('Verbindungsfehler. Bitte erneut versuchen.');
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 11px', boxSizing: 'border-box',
    background: 'var(--card-bg, #13151f)', border: '1px solid var(--border)',
    borderRadius: 6, color: 'var(--text)', fontSize: 13.5,
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg, #0d0f1a)',
    }}>
      <div style={{ width: 380 }}>
        {/* Logo / branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px',
          }}>EA</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>EastAfrica Export OS</div>
            <div style={{ fontSize: 11, color: 'var(--text-3, #5d667d)' }}>Handelsplattform · v2.4.1</div>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '28px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 3, letterSpacing: '-0.3px' }}>
            Anmelden
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3, #5d667d)', marginBottom: 24 }}>
            Melde dich mit deinem Arbeits-Konto an.
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, display: 'block', marginBottom: 5, color: 'var(--text-3, #5d667d)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firma.de"
                required
                autoFocus
                style={inp}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--text-3, #5d667d)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Passwort
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inp}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: 16, padding: '9px 12px',
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: 6, fontSize: 12.5, color: '#f87171', lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: loading ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.9)',
                color: '#fff', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
                transition: 'background 0.15s', letterSpacing: '-0.2px',
              }}
            >
              {loading ? 'Wird angemeldet…' : 'Anmelden →'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-3, #5d667d)' }}>
          Kein Zugang? Wende dich an deinen Admin.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
