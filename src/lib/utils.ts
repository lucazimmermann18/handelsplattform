// Shared formatting utilities for EastAfrica Export OS

export const fmtCur = (v: number | null | undefined, cur = '€'): string => {
  if (v == null || isNaN(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return cur + ' ' + (v / 1_000_000).toFixed(2) + 'M';
  if (abs >= 10_000) return cur + ' ' + Math.round(v / 1000) + 'k';
  return cur + ' ' + v.toLocaleString('de-DE');
};

export const fmtNum = (v: number | null | undefined): string =>
  v == null ? '—' : v.toLocaleString('de-DE');

export const fmtKg = (v: number | null | undefined): string =>
  v == null ? '—' : v.toLocaleString('de-DE') + ' kg';

export const fmtPct = (v: number | null | undefined): string =>
  v == null ? '—' : v + '%';

export const fmtDate = (s: string | null | undefined): string =>
  s ? new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) : '—';

export const fmtDateLong = (s: string | null | undefined): string =>
  s ? new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
