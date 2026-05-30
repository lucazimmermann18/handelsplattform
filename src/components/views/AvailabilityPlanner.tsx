'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/data-context';
import { t } from '@/lib/i18n';
import { Ic } from '@/components/ui/icons';
import { useAiConfig } from '@/lib/ai-config';
import type { HarvestCalendar } from '@/lib/types';

interface Props { lang: 'de' | 'en' }

// ─── Constants ────────────────────────────────────────────────────────────────

const ORIGIN_COUNTRIES = [
  { code: 'ET', defaultHarvestMonths: [11,12,1,2],  defaultProcessingWeeks: 6, defaultExportStart: 1, defaultExportEnd: 4  },
  { code: 'KE', defaultHarvestMonths: [10,11,12,1,2,6,7,8], defaultProcessingWeeks: 4, defaultExportStart: 11, defaultExportEnd: 3 },
  { code: 'UG', defaultHarvestMonths: [1,2,3,4,10,11,12], defaultProcessingWeeks: 3, defaultExportStart: 2, defaultExportEnd: 5  },
  { code: 'TZ', defaultHarvestMonths: [7,8,9,10],  defaultProcessingWeeks: 5, defaultExportStart: 8, defaultExportEnd: 11 },
  { code: 'RW', defaultHarvestMonths: [3,4,5,9,10], defaultProcessingWeeks: 4, defaultExportStart: 4, defaultExportEnd: 6 },
  { code: 'OTHER', defaultHarvestMonths: [], defaultProcessingWeeks: 4, defaultExportStart: 1, defaultExportEnd: 3 },
];

const PROCESSING_TYPES = ['washed', 'natural', 'honey'];

const MONTH_KEYS = [
  'ap_month_jan','ap_month_feb','ap_month_mar','ap_month_apr',
  'ap_month_may','ap_month_jun','ap_month_jul','ap_month_aug',
  'ap_month_sep','ap_month_oct','ap_month_nov','ap_month_dec',
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function getProcessingMonths(entry: HarvestCalendar): number[] {
  const processingMonthCount = Math.min(Math.ceil(entry.processingWeeks / 4), 2);
  const lastHarvestMonth = entry.harvestMonths.length > 0
    ? Math.max(...entry.harvestMonths)
    : 0;
  if (lastHarvestMonth === 0) return [];
  const months: number[] = [];
  for (let i = 1; i <= processingMonthCount; i++) {
    months.push(((lastHarvestMonth - 1 + i) % 12) + 1);
  }
  return months;
}

function getExportMonths(entry: HarvestCalendar): number[] {
  const months: number[] = [];
  let m = entry.exportStartMonth;
  const end = entry.exportEndMonth;
  for (let i = 0; i < 12; i++) {
    months.push(m);
    if (m === end) break;
    m = (m % 12) + 1;
  }
  return months;
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function AvailabilityPlannerView({ lang }: Props) {
  const { data, refresh } = useData();
  const { generate, isConfigured } = useAiConfig();

  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<HarvestCalendar | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiExpanded, setAiExpanded] = useState(false);

  // Form state
  const [formProductId, setFormProductId] = useState('');
  const [formOrigin, setFormOrigin] = useState('ET');
  const [formHarvestMonths, setFormHarvestMonths] = useState<number[]>([11,12,1,2]);
  const [formProcessingWeeks, setFormProcessingWeeks] = useState(6);
  const [formExportStart, setFormExportStart] = useState(1);
  const [formExportEnd, setFormExportEnd] = useState(4);
  const [formProcessingTypes, setFormProcessingTypes] = useState<string[]>(['washed']);
  const [formQtyMt, setFormQtyMt] = useState('');
  const [formNotes, setFormNotes] = useState('');

  if (!data) return null;

  const products = data.products;
  const harvestCalendar = data.harvestCalendar;

  const currentMonth = new Date().getMonth() + 1; // 1-12

  // Entries visible in the main area
  const visibleEntries = selectedProductId
    ? harvestCalendar.filter(e => e.productId === selectedProductId)
    : harvestCalendar;

  // Summary counts
  const availableThisMonth = Array.from(new Set(
    harvestCalendar
      .filter(e => getExportMonths(e).includes(currentMonth))
      .map(e => e.productId)
  )).length;

  // Open form for new entry
  const openNewForm = () => {
    const defaults = ORIGIN_COUNTRIES.find(o => o.code === 'ET') ?? ORIGIN_COUNTRIES[0];
    setFormProductId(selectedProductId ?? (products[0]?.id ?? ''));
    setFormOrigin('ET');
    setFormHarvestMonths(defaults.defaultHarvestMonths);
    setFormProcessingWeeks(defaults.defaultProcessingWeeks);
    setFormExportStart(defaults.defaultExportStart);
    setFormExportEnd(defaults.defaultExportEnd);
    setFormProcessingTypes(['washed']);
    setFormQtyMt('');
    setFormNotes('');
    setEditEntry(null);
    setShowForm(true);
  };

  // Open form for editing
  const openEditForm = (entry: HarvestCalendar) => {
    setFormProductId(entry.productId);
    setFormOrigin(entry.originCountry);
    setFormHarvestMonths(entry.harvestMonths);
    setFormProcessingWeeks(entry.processingWeeks);
    setFormExportStart(entry.exportStartMonth);
    setFormExportEnd(entry.exportEndMonth);
    setFormProcessingTypes(entry.processingTypes);
    setFormQtyMt(entry.typicalQtyMt !== null ? String(entry.typicalQtyMt) : '');
    setFormNotes(entry.notes);
    setEditEntry(entry);
    setShowForm(true);
  };

  const handleOriginChange = (code: string) => {
    setFormOrigin(code);
    if (!editEntry) {
      const defaults = ORIGIN_COUNTRIES.find(o => o.code === code);
      if (defaults) {
        setFormHarvestMonths(defaults.defaultHarvestMonths);
        setFormProcessingWeeks(defaults.defaultProcessingWeeks);
        setFormExportStart(defaults.defaultExportStart);
        setFormExportEnd(defaults.defaultExportEnd);
      }
    }
  };

  const toggleHarvestMonth = (month: number) => {
    setFormHarvestMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month].sort((a, b) => a - b)
    );
  };

  const toggleProcessingType = (type: string) => {
    setFormProcessingTypes(prev =>
      prev.includes(type) ? prev.filter(p => p !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const { createClient } = await import('@/lib/supabase/client');
    const sb = createClient();

    const payload = {
      product_id: formProductId,
      origin_country: formOrigin,
      harvest_months: formHarvestMonths,
      processing_weeks: formProcessingWeeks,
      export_start_month: formExportStart,
      export_end_month: formExportEnd,
      processing_types: formProcessingTypes,
      typical_qty_mt: formQtyMt ? parseFloat(formQtyMt) : null,
      notes: formNotes,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    if (editEntry) {
      await sb.from('harvest_calendar').update(payload).eq('id', editEntry.id);
    } else {
      await sb.from('harvest_calendar').insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setEditEntry(null);
    refresh();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { createClient } = await import('@/lib/supabase/client');
    const sb = createClient();
    await sb.from('harvest_calendar').delete().eq('id', id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    refresh();
  };

  const handleAiForecast = async () => {
    if (!isConfigured) return;
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;
    setAiLoading(true);
    setAiExpanded(true);
    const entries = visibleEntries.map(e => ({
      origin: e.originCountry,
      harvestMonths: e.harvestMonths,
      exportWindow: `${e.exportStartMonth}→${e.exportEndMonth}`,
      processingWeeks: e.processingWeeks,
    }));
    const prompt = `Du bist Exportplanungsexperte für Ostafrika-Agrarprodukte.
Erstelle einen kompakten Verfügbarkeitsbrief für folgendes Produkt:
Produkt: ${selectedProduct.name} (${selectedProduct.origin})
Einträge: ${JSON.stringify(entries)}

Analysiere: 1) Beste Exportmonate, 2) Engpässe/Gaps in der Verfügbarkeit, 3) Empfehlungen für Vorauskäufe/Buchungen. Max 250 Wörter. Auf ${lang === 'de' ? 'Deutsch' : 'English'}.`;
    try {
      const result = await generate(prompt);
      setAiResult(result);
    } catch {
      setAiResult('Fehler beim Generieren der Prognose.');
    }
    setAiLoading(false);
  };

  // ─── Calendar Grid ──────────────────────────────────────────────────────────

  const renderCalendarGrid = () => {
    if (harvestCalendar.length === 0) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
          <Ic name="leaf" />
          <div style={{ marginTop: 12, fontSize: 15 }}>
            {t(lang, 'ap_no_entries')}
          </div>
        </div>
      );
    }

    const rows = visibleEntries.map(entry => {
      const productName = products.find(p => p.id === entry.productId)?.name ?? entry.productId;
      const originLabel = t(lang, `ap_origin_${entry.originCountry.toLowerCase()}`);
      const harvestSet = new Set(entry.harvestMonths);
      const processingSet = new Set(getProcessingMonths(entry));
      const exportSet = new Set(getExportMonths(entry));

      return (
        <tr key={entry.id}>
          <td style={{
            minWidth: 200, maxWidth: 240, padding: '4px 8px',
            fontSize: 12, color: 'var(--text-2)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            borderBottom: '1px solid var(--border)',
            position: 'sticky', left: 0, background: 'var(--bg-2)', zIndex: 1,
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{productName}</span>
            {' / '}
            <span style={{ color: 'var(--text-3)' }}>{originLabel}</span>
          </td>
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const isHarvest = harvestSet.has(month);
            const isExport = exportSet.has(month);
            const isProcessing = processingSet.has(month);
            const isCurrentMonth = month === currentMonth;

            let bg = 'var(--surface-2)';
            let color = 'var(--text-3)';
            let content = '';

            if (isHarvest) { bg = '#2d6a4f'; color = 'white'; content = '●'; }
            else if (isExport) { bg = '#1d6fa4'; color = 'white'; content = '◆'; }
            else if (isProcessing) { bg = '#e9a824'; color = 'white'; content = '◐'; }

            return (
              <td key={month} style={{
                width: 40, minWidth: 40, height: 32, padding: 0,
                textAlign: 'center', verticalAlign: 'middle',
                borderBottom: '1px solid var(--border)',
                borderLeft: isCurrentMonth ? '2px solid var(--text-2)' : '1px solid var(--border)',
                borderRight: isCurrentMonth ? '2px solid var(--text-2)' : undefined,
              }}>
                <div style={{
                  width: 32, height: 24, margin: '0 auto',
                  background: bg, color,
                  borderRadius: 4, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 600,
                }}>
                  {content}
                </div>
              </td>
            );
          })}
        </tr>
      );
    });

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{
                minWidth: 200, padding: '6px 8px',
                textAlign: 'left', fontSize: 11, fontWeight: 600,
                color: 'var(--text-3)', borderBottom: '2px solid var(--border)',
                position: 'sticky', left: 0, background: 'var(--bg-2)', zIndex: 2,
              }}>
                {t(lang, 'ap_product')} / {t(lang, 'ap_origin')}
              </th>
              {MONTH_KEYS.map((key, i) => (
                <th key={i} style={{
                  width: 40, minWidth: 40, padding: '6px 2px',
                  textAlign: 'center', fontSize: 11, fontWeight: 600,
                  color: (i + 1) === currentMonth ? 'var(--text)' : 'var(--text-3)',
                  borderBottom: '2px solid var(--border)',
                  background: (i + 1) === currentMonth ? 'var(--surface-3)' : undefined,
                }}>
                  {t(lang, key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows : (
              <tr>
                <td colSpan={13} style={{
                  padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 14,
                }}>
                  {t(lang, 'ap_no_entries')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // ─── List View ──────────────────────────────────────────────────────────────

  const renderListView = () => {
    if (!selectedProductId) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
          {t(lang, 'ap_no_entries')}
        </div>
      );
    }
    const entries = harvestCalendar.filter(e => e.productId === selectedProductId);
    if (entries.length === 0) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
          {t(lang, 'ap_no_entries')}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.map(entry => {
          const originLabel = t(lang, `ap_origin_${entry.originCountry.toLowerCase()}`);
          const originFlag: Record<string, string> = { ET: '🇪🇹', KE: '🇰🇪', UG: '🇺🇬', TZ: '🇹🇿', RW: '🇷🇼', OTHER: '🌍' };
          const flag = originFlag[entry.originCountry] ?? '🌍';
          return (
            <div key={entry.id} style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{flag}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{originLabel}</span>
                  {entry.status === 'active' && (
                    <span style={{ background: '#2d6a4f', color: 'white', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>
                      aktiv
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEditForm(entry)} style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                    color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Ic name="edit" /> {t(lang, 'ap_edit_entry')}
                  </button>
                  {confirmDeleteId === entry.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id} style={{
                        background: '#c0392b', color: 'white', border: 'none',
                        borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                      }}>
                        {deletingId === entry.id ? '…' : t(lang, 'ap_delete')}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} style={{
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                        color: 'var(--text-2)',
                      }}>
                        {t(lang, 'ap_cancel')}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(entry.id)} style={{
                      background: 'transparent', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                      color: '#c0392b', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Ic name="trash" /> {t(lang, 'ap_delete')}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {/* Harvest Months */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                    {t(lang, 'ap_harvest_months')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {entry.harvestMonths.map(m => (
                      <span key={m} style={{
                        background: '#2d6a4f', color: 'white',
                        borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600,
                      }}>
                        {t(lang, MONTH_KEYS[m - 1])}
                      </span>
                    ))}
                    {entry.harvestMonths.length === 0 && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                  </div>
                </div>
                {/* Export Window */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                    {t(lang, 'ap_export_window_short')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {getExportMonths(entry).map(m => (
                      <span key={m} style={{
                        background: '#1d6fa4', color: 'white',
                        borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600,
                      }}>
                        {t(lang, MONTH_KEYS[m - 1])}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Processing */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                    {t(lang, 'ap_processing_weeks')}
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                    {entry.processingWeeks}w
                  </span>
                </div>
                {/* Processing types */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                    {t(lang, 'ap_processing_types')}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {entry.processingTypes.map(pt => (
                      <span key={pt} style={{
                        background: 'var(--surface-2)', color: 'var(--text-2)',
                        borderRadius: 4, padding: '2px 6px', fontSize: 11,
                        border: '1px solid var(--border)',
                      }}>
                        {t(lang, `ap_processing_${pt}`)}
                      </span>
                    ))}
                    {entry.processingTypes.length === 0 && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                  </div>
                </div>
                {/* Quantity */}
                {entry.typicalQtyMt !== null && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                      {t(lang, 'ap_typical_qty')}
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                      {entry.typicalQtyMt} {t(lang, 'ap_qty_mt')}
                    </span>
                  </div>
                )}
              </div>
              {entry.notes && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--surface-3)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)' }}>
                  {entry.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Form ───────────────────────────────────────────────────────────────────

  const renderForm = () => {
    if (!showForm) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} onClick={() => setShowForm(false)}>
        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24, width: 560, maxWidth: '96vw',
          maxHeight: '90vh', overflowY: 'auto',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {editEntry ? t(lang, 'ap_edit_entry') : t(lang, 'ap_add_entry')}
            </h3>
            <button onClick={() => setShowForm(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
              fontSize: 18, padding: 4,
            }}>
              <Ic name="x" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Product */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                {t(lang, 'ap_product')} *
              </label>
              <select
                value={formProductId}
                onChange={e => setFormProductId(e.target.value)}
                disabled={!!editEntry}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: 13,
                  opacity: editEntry ? 0.6 : 1,
                }}
              >
                <option value="">— {t(lang, 'ap_product')} —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Origin country */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                {t(lang, 'ap_origin')} *
              </label>
              <select
                value={formOrigin}
                onChange={e => handleOriginChange(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: 13,
                }}
              >
                {ORIGIN_COUNTRIES.map(o => (
                  <option key={o.code} value={o.code}>{t(lang, `ap_origin_${o.code.toLowerCase()}`)}</option>
                ))}
              </select>
            </div>

            {/* Harvest months */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>
                {t(lang, 'ap_harvest_months')}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {MONTH_KEYS.map((key, i) => {
                  const month = i + 1;
                  const selected = formHarvestMonths.includes(month);
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => toggleHarvestMonth(month)}
                      style={{
                        padding: '4px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: selected ? '#2d6a4f' : 'var(--surface-2)',
                        color: selected ? 'white' : 'var(--text-2)',
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      {t(lang, key)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Processing weeks */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                {t(lang, 'ap_processing_weeks')}
              </label>
              <input
                type="number"
                min={1} max={24}
                value={formProcessingWeeks}
                onChange={e => setFormProcessingWeeks(parseInt(e.target.value) || 4)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: 13,
                }}
              />
            </div>

            {/* Export window */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                  {t(lang, 'ap_export_start')}
                </label>
                <select
                  value={formExportStart}
                  onChange={e => setFormExportStart(parseInt(e.target.value))}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text)', fontSize: 13,
                  }}
                >
                  {MONTH_KEYS.map((key, i) => (
                    <option key={i + 1} value={i + 1}>{t(lang, key)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                  {t(lang, 'ap_export_end')}
                </label>
                <select
                  value={formExportEnd}
                  onChange={e => setFormExportEnd(parseInt(e.target.value))}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text)', fontSize: 13,
                  }}
                >
                  {MONTH_KEYS.map((key, i) => (
                    <option key={i + 1} value={i + 1}>{t(lang, key)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Processing types */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>
                {t(lang, 'ap_processing_types')}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PROCESSING_TYPES.map(pt => {
                  const selected = formProcessingTypes.includes(pt);
                  return (
                    <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleProcessingType(pt)}
                        style={{ cursor: 'pointer' }}
                      />
                      {t(lang, `ap_processing_${pt}`)}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Typical quantity */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                {t(lang, 'ap_typical_qty')}
              </label>
              <input
                type="number"
                min={0} step={0.1}
                value={formQtyMt}
                onChange={e => setFormQtyMt(e.target.value)}
                placeholder="optional"
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: 13,
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                {t(lang, 'ap_notes')}
              </label>
              <textarea
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: 13, resize: 'vertical',
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-2)',
                }}
              >
                {t(lang, 'ap_cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formProductId}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  background: '#2d6a4f', border: 'none', color: 'white', fontWeight: 600,
                  opacity: saving || !formProductId ? 0.6 : 1,
                }}
              >
                {saving ? '…' : t(lang, 'ap_save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (products.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
        <Ic name="product" />
        <div style={{ marginTop: 12, fontSize: 15 }}>{t(lang, 'ap_no_products')}</div>
      </div>
    );
  }

  const selectedProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* ── Left Sidebar — Product Selector ── */}
      <div style={{
        width: 220, minWidth: 220, borderRight: '1px solid var(--border)',
        overflowY: 'auto', padding: '12px 0',
        background: 'var(--bg-2)',
      }}>
        {/* "All" option */}
        <div
          onClick={() => setSelectedProductId(null)}
          style={{
            padding: '8px 14px', cursor: 'pointer', fontSize: 13,
            background: selectedProductId === null ? 'var(--surface-3)' : 'transparent',
            color: selectedProductId === null ? 'var(--text)' : 'var(--text-2)',
            borderLeft: selectedProductId === null ? '3px solid #2d6a4f' : '3px solid transparent',
            fontWeight: selectedProductId === null ? 600 : 400,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span>{t(lang, 'all')}</span>
          <span style={{
            background: 'var(--surface-2)', color: 'var(--text-3)',
            borderRadius: 10, padding: '1px 6px', fontSize: 11,
          }}>
            {harvestCalendar.length}
          </span>
        </div>

        {products.map(product => {
          const count = harvestCalendar.filter(e => e.productId === product.id).length;
          const isActive = selectedProductId === product.id;
          return (
            <div
              key={product.id}
              onClick={() => setSelectedProductId(product.id)}
              style={{
                padding: '8px 14px', cursor: 'pointer',
                background: isActive ? 'var(--surface-3)' : 'transparent',
                borderLeft: isActive ? '3px solid #2d6a4f' : '3px solid transparent',
              }}
            >
              <div style={{
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--text)' : 'var(--text-2)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {product.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{
                  fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)',
                  borderRadius: 3, padding: '1px 5px', border: '1px solid var(--border)',
                }}>
                  {product.cat}
                </span>
                {count > 0 && (
                  <span style={{
                    background: '#2d6a4f', color: 'white',
                    borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 600,
                  }}>
                    {count}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                {t(lang, 'ap_title')}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
                {t(lang, 'ap_subtitle')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* View toggle */}
              <div style={{
                display: 'flex', background: 'var(--surface-2)',
                borderRadius: 6, padding: 2, border: '1px solid var(--border)',
              }}>
                <button
                  onClick={() => setView('calendar')}
                  style={{
                    padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                    border: 'none',
                    background: view === 'calendar' ? 'var(--bg)' : 'transparent',
                    color: view === 'calendar' ? 'var(--text)' : 'var(--text-3)',
                    fontWeight: view === 'calendar' ? 600 : 400,
                  }}
                >
                  {t(lang, 'ap_calendar_view')}
                </button>
                <button
                  onClick={() => setView('list')}
                  style={{
                    padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                    border: 'none',
                    background: view === 'list' ? 'var(--bg)' : 'transparent',
                    color: view === 'list' ? 'var(--text)' : 'var(--text-3)',
                    fontWeight: view === 'list' ? 600 : 400,
                  }}
                >
                  {t(lang, 'ap_list_view')}
                </button>
              </div>
              {/* Add entry */}
              <button
                onClick={openNewForm}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#2d6a4f', color: 'white', border: 'none',
                  borderRadius: 6, padding: '6px 14px', fontSize: 13,
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                <Ic name="plus" /> {t(lang, 'ap_add_entry')}
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: 20, overflowX: 'hidden' }}>
          {/* Legend */}
          {view === 'calendar' && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { color: '#2d6a4f', label: t(lang, 'ap_legend_harvest') },
                { color: '#e9a824', label: t(lang, 'ap_legend_processing') },
                { color: '#1d6fa4', label: t(lang, 'ap_legend_export') },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          )}

          {view === 'calendar' ? renderCalendarGrid() : renderListView()}

          {/* Summary bar */}
          <div style={{
            marginTop: 20, padding: '10px 14px',
            background: 'var(--surface-2)', borderRadius: 8,
            border: '1px solid var(--border)',
            display: 'flex', gap: 20, flexWrap: 'wrap',
            fontSize: 13, color: 'var(--text-2)',
          }}>
            <span>
              <strong>{products.length}</strong> {t(lang, 'ap_product').toLowerCase()}e
            </span>
            <span>
              <strong>{harvestCalendar.length}</strong> {lang === 'de' ? 'Einträge' : 'entries'}
            </span>
            <span>
              <strong>{availableThisMonth}</strong> {t(lang, 'ap_availability_this_month')}
            </span>
          </div>

          {/* Calendar integration hint */}
          <div style={{
            marginTop: 14, padding: '10px 14px',
            background: 'var(--surface-2)', borderRadius: 8,
            border: '1px solid var(--border-2)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
            fontSize: 12, color: 'var(--text-3)',
          }}>
            <Ic name="info" />
            <span>
              {lang === 'de'
                ? 'Diese Daten sind auch im Kalender-Modul sichtbar. Exportfenster werden automatisch als Termine angezeigt.'
                : 'This data is also visible in the Calendar module. Export windows are automatically shown as events.'}
            </span>
          </div>

          {/* AI Forecast section */}
          {selectedProduct && isConfigured && (
            <div style={{
              marginTop: 14, border: '1px solid var(--border)',
              borderRadius: 8, overflow: 'hidden',
            }}>
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => setAiExpanded(v => !v)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  <Ic name="sparkle" />
                  {t(lang, 'ap_ai_forecast')}
                </div>
                <Ic name={aiExpanded ? 'chevD' : 'chevR'} />
              </div>
              {aiExpanded && (
                <div style={{ padding: 14 }}>
                  <button
                    onClick={handleAiForecast}
                    disabled={aiLoading}
                    style={{
                      background: '#2d6a4f', color: 'white', border: 'none',
                      borderRadius: 6, padding: '7px 14px', fontSize: 13,
                      cursor: 'pointer', fontWeight: 600, marginBottom: 12,
                      opacity: aiLoading ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Ic name="sparkle" />
                    {aiLoading ? (lang === 'de' ? 'Generiere…' : 'Generating…') : t(lang, 'ap_ai_forecast_btn')}
                  </button>
                  {aiResult && (
                    <div style={{
                      background: 'var(--surface-2)', borderRadius: 8,
                      padding: 14, fontSize: 13, color: 'var(--text-2)',
                      lineHeight: 1.6, whiteSpace: 'pre-wrap',
                      border: '1px solid var(--border)',
                    }}>
                      {aiResult}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Form modal ── */}
      {renderForm()}
    </div>
  );
}
