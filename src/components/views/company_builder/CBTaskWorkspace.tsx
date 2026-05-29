'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '@/lib/data-context';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/icons';
import type { SetupTask } from '@/lib/types';
import { CB_SECTIONS } from './types';
import type { CBStatus } from './types';
import { StatusBadge, PriorityBadge, DocQualityBadge } from './shared';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import {
  SECTION_STEPS, SECTION_ADVISOR_TIPS, COMMON_STEPS, SECTION_TO_BP_CHAPTER,
  loadWs, saveWs,
  type WorkspaceState, type RiskRow, type WsAssumption, type WorkspaceStep,
} from './workspaceTypes';
import { appendToBpChapter } from '@/lib/bp-storage';
import { useAiConfig } from '@/lib/ai-config';

// ── Props ──────────────────────────────────────────────────────────────────────

interface CBTaskWorkspaceProps {
  taskId: string;
  onBack: () => void;
  lang: Lang;
}

// ── Time-ago helper ────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10) return 'gerade eben';
  if (diff < 60) return `vor ${diff}s`;
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}min`;
  return `vor ${Math.floor(diff / 3600)}h`;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export const CBTaskWorkspace = ({ taskId, onBack, lang }: CBTaskWorkspaceProps) => {
  const { data: M, refresh } = useData();
  const aiConfig = useAiConfig();
  const task = M?.setupTasks.find(st => st.id === taskId) ?? null;

  const [ws, setWs] = useState<WorkspaceState>(() => loadWs(taskId));
  const [activeStep, setActiveStep] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bpToast, setBpToast] = useState(false);
  const [whyExpanded, setWhyExpanded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  // Initialize active step once task is loaded
  useEffect(() => {
    if (!task || initialized.current) return;
    initialized.current = true;
    const steps = [...(SECTION_STEPS[task.section] ?? []), ...COMMON_STEPS];
    const first = steps.find(s => !ws.answers[s.id]?.trim());
    setActiveStep(first?.id ?? steps[0]?.id ?? '_risks');
  }, [task, ws.answers]);

  // Auto-save: ws (localStorage-only, separate from Supabase)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveWs({ ...ws, lastSaved: new Date().toISOString() });
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [ws]);

  const updateAnswer = useCallback((stepId: string, value: string) => {
    setWs(prev => ({ ...prev, answers: { ...prev.answers, [stepId]: value } }));
  }, []);

  if (!M || !task) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
        Aufgabe wird geladen…
      </div>
    );
  }

  const section = CB_SECTIONS.find(s => s.key === task.section);
  const sectionColor = section?.color ?? '#60a5fa';
  const sectionSteps = SECTION_STEPS[task.section] ?? [];
  const allSteps = [...sectionSteps, ...COMMON_STEPS];
  const advisorTips = SECTION_ADVISOR_TIPS[task.section] ?? [];
  const bpChapter = SECTION_TO_BP_CHAPTER[task.section];

  const answeredCount = allSteps.filter(s => {
    if (s.id === '_risks') return ws.riskRows.length > 0;
    if (s.id === '_evidence') return ws.evidenceStatus !== 'fehlt';
    if (s.id === '_artifact') return !!ws.artifact;
    if (s.id === '_finish') return task.status === 'done';
    return !!ws.answers[s.id]?.trim();
  }).length;
  const progressPct = allSteps.length > 0 ? Math.round((answeredCount / allSteps.length) * 100) : 0;

  const currentStepDef = allSteps.find(s => s.id === activeStep);

  // ── AI helpers ──────────────────────────────────────────────────────────────

  const callAI = async (btnId: string, prompt: string): Promise<string> => {
    setAiLoading(btnId);
    setAiError(null);
    try {
      if (!aiConfig?.isConfigured) {
        throw new Error('Kein KI-Modell konfiguriert. Bitte in den Einstellungen einen API-Key hinterlegen.');
      }
      const result = await aiConfig.generate(prompt);
      return result;
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'KI-Fehler');
      return '';
    } finally {
      setAiLoading(null);
    }
  };

  const buildContext = () => {
    const answered = allSteps
      .filter(s => ws.answers[s.id]?.trim())
      .map(s => `${s.label}: ${ws.answers[s.id]}`)
      .join('\n');
    const platformData = M ? `Produkte: ${M.products.length}, Lieferanten: ${M.suppliers.length}, Käufer: ${M.buyers.length}, Deals: ${M.deals.length}, Aufträge: ${M.orders.length}` : '';
    return `Aufgabe: ${task.title}\nBereich: ${section?.label ?? task.section}\nBeschreibung: ${task.description ?? ''}\nWarum wichtig: ${task.whyImportant ?? ''}\n\nBisher beantwortet:\n${answered || '(noch keine Antworten)'}\n\nPlattformdaten: ${platformData}`;
  };

  const handleAnalyse = async () => {
    if (!currentStepDef) return;
    const prompt = `Du bist ein erfahrener Unternehmensberater für Exporthandel aus Afrika.\n\n${buildContext()}\n\nAktueller Schritt: ${currentStepDef.label}\nFrage: ${currentStepDef.question}\n\nGib eine präzise, praxisorientierte Analyse mit 3–5 konkreten Empfehlungen für diesen Schritt. Keine allgemeinen Phrasen — beziehe dich auf die spezifische Situation des Exporthandelsunternehmens.`;
    const result = await callAI('analyse', prompt);
    if (result) updateAnswer(activeStep, (ws.answers[activeStep] ? ws.answers[activeStep] + '\n\n[KI-Analyse]:\n' : '') + result);
  };

  const handleDraft = async () => {
    const prompt = `Du bist ein erfahrener Unternehmensberater für Exporthandel aus Afrika.\n\n${buildContext()}\n\nErstelle ein professionelles Ergebnis-Dokument für die Aufgabe "${task.title}" im Bereich "${section?.label ?? task.section}".\n\nDas Dokument soll folgende Abschnitte enthalten:\n- Zusammenfassung\n- Getroffene Entscheidungen / Ergebnisse\n- Begründung\n- Risiken und offene Punkte\n- Nächste Schritte\n\nSchreibe in professionellem Deutsch, konkret und umsetzungsorientiert. Basiere den Inhalt auf den bisher gegebenen Antworten.`;
    const result = await callAI('draft', prompt);
    if (result) {
      setWs(prev => ({ ...prev, artifact: result, artifactGeneratedAt: new Date().toISOString() }));
      setActiveStep('_artifact');
    }
  };

  const handleAdvisorLetter = async () => {
    if (!task.externalAdvisor) return;
    const prompt = `Verfasse ein professionelles Briefing für den externen Berater "${task.externalAdvisor}" bezüglich der Aufgabe "${task.title}".\n\n${buildContext()}\n\nDer Brief soll enthalten: Kontext der Aufgabe, konkrete Beratungsfragen, gewünschte Ergebnisse, Zeitrahmen. Professioneller Ton, auf Deutsch.`;
    const result = await callAI('letter', prompt);
    if (result) setWs(prev => ({ ...prev, notes: prev.notes + (prev.notes ? '\n\n' : '') + `[Berater-Brief für ${task.externalAdvisor}]:\n${result}` }));
  };

  const handleToBP = () => {
    if (!ws.artifact || !bpChapter) return;
    appendToBpChapter(bpChapter, ws.artifact, task.title);
    setBpToast(true);
    setTimeout(() => setBpToast(false), 3000);
  };

  // ── Supabase status update ──────────────────────────────────────────────────
  const handleStatusChange = async (newStatus: CBStatus) => {
    const sb = createClient();
    setSaving(true);
    await sb.from('setup_tasks').update({ status: newStatus }).eq('id', task.id);
    await refresh();
    setSaving(false);
  };

  // ── Finish task ─────────────────────────────────────────────────────────────
  const canFinish = answeredCount >= Math.ceil(allSteps.length * 0.5) && !!ws.artifact;

  const handleFinish = async () => {
    if (!canFinish) return;
    const sb = createClient();
    setSaving(true);
    await sb.from('setup_tasks').update({
      status: 'done',
      doc_quality: ws.artifact ? 'vollständig' : 'teilweise',
    }).eq('id', task.id);
    await refresh();
    setSaving(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top header bar */}
      <div style={{
        flexShrink: 0, padding: '10px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Ic name="chevL" size={11} /> {t(lang, 'back')}
        </button>

        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${sectionColor}20`, border: `1px solid ${sectionColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ic name={section?.icon ?? 'flag'} size={13} color={sectionColor} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>
            {section?.label ?? task.section} · Workspace
          </div>
        </div>

        {/* AI action buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {([
            { id: 'analyse', label: t(lang, 'cb_ws_analyse'),        icon: 'sparkle', color: '#a78bfa', fn: handleAnalyse,      disabled: false },
            { id: 'draft',   label: t(lang, 'cb_ws_draft'),          icon: 'doc',     color: '#60a5fa', fn: handleDraft,        disabled: false },
            { id: 'letter',  label: t(lang, 'cb_ws_advisor_letter'), icon: 'mail',    color: '#34d399', fn: handleAdvisorLetter, disabled: !task.externalAdvisor },
            { id: 'bp',      label: t(lang, 'cb_ws_to_bp'),          icon: 'flag',    color: '#f59e0b', fn: handleToBP,         disabled: !ws.artifact || !bpChapter },
          ] as const).map(btn => (
            <button
              key={btn.id}
              onClick={btn.fn}
              disabled={!!btn.disabled || aiLoading === btn.id}
              title={btn.disabled ? (btn.id === 'letter' ? t(lang, 'cb_ws_no_advisor') : 'Erst Entwurf erstellen') : btn.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 6, cursor: btn.disabled ? 'default' : 'pointer',
                background: btn.disabled ? 'transparent' : `${btn.color}15`,
                border: `1px solid ${btn.disabled ? 'var(--border)' : btn.color + '40'}`,
                color: btn.disabled ? 'var(--text-4)' : btn.color,
                fontSize: 11, fontWeight: 600, opacity: aiLoading && aiLoading !== btn.id ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              {aiLoading === btn.id
                ? <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="20 60" /></svg>
                : <Ic name={btn.icon} size={11} />
              }
              {btn.label}
            </button>
          ))}
        </div>

        {/* Last saved + BP toast */}
        <div style={{ fontSize: 10, color: 'var(--text-4)', flexShrink: 0, textAlign: 'right', minWidth: 100 }}>
          {bpToast
            ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>{t(lang, 'cb_ws_added_to_bp')}</span>
            : `${t(lang, 'cb_ws_saved')}: ${timeAgo(ws.lastSaved)}`
          }
        </div>
      </div>

      {aiError && (
        <div style={{ flexShrink: 0, padding: '6px 20px', background: 'rgba(248,113,113,0.1)', borderBottom: '1px solid rgba(248,113,113,0.2)', fontSize: 11.5, color: '#f87171' }}>
          ⚠ {aiError} — <button style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 11.5, textDecoration: 'underline' }} onClick={() => setAiError(null)}>Schließen</button>
        </div>
      )}

      {/* Main body: left nav + center + right */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left step navigation */}
        <div style={{
          width: 200, flexShrink: 0, borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--surface-2)',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
            {allSteps.map((step, idx) => {
              const isActive = activeStep === step.id;
              const isDone = (() => {
                if (step.id === '_risks') return ws.riskRows.length > 0;
                if (step.id === '_evidence') return ws.evidenceStatus !== 'fehlt';
                if (step.id === '_artifact') return !!ws.artifact;
                if (step.id === '_finish') return task.status === 'done';
                return !!ws.answers[step.id]?.trim();
              })();
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6,
                    background: isActive ? `${sectionColor}18` : 'transparent',
                    borderLeft: `3px solid ${isActive ? sectionColor : isDone ? '#10b981' : 'transparent'}`,
                    border: isActive ? `1px solid ${sectionColor}30` : '1px solid transparent',
                    color: isActive ? 'var(--text)' : isDone ? 'var(--text-2)' : 'var(--text-3)',
                    cursor: 'pointer', marginBottom: 3,
                    transition: 'all 0.12s',
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}
                >
                  <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? '#10b981' : isActive ? sectionColor : 'var(--surface-3)',
                    fontSize: 9, color: isDone || isActive ? '#fff' : 'var(--text-3)',
                  }}>
                    {isDone ? '✓' : idx + 1}
                  </span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.3 }}>{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ flexShrink: 0, padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{t(lang, 'cb_ws_progress')}</span>
              <span style={{ fontSize: 10, color: sectionColor, fontWeight: 600 }}>{progressPct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-3)' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: sectionColor, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {/* Center content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px 28px', maxWidth: 680, width: '100%' }}>

            {/* Task header info */}
            <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
                {task.docQuality && task.docQuality !== 'ungeprüft' && <DocQualityBadge quality={task.docQuality} />}
                {task.blockerGoLive && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>🚫 Go-Live</span>}
                {task.blockerFirstDeal && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>🚫 Deal</span>}
              </div>

              {task.description && (
                <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{task.description}</p>
              )}

              {task.whyImportant && (
                <div>
                  <button
                    onClick={() => setWhyExpanded(e => !e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: sectionColor, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Ic name={whyExpanded ? 'chevD' : 'chevR'} size={10} /> {t(lang, 'cb_ws_why')}
                  </button>
                  {whyExpanded && (
                    <div style={{ marginTop: 6, padding: '8px 12px', background: `${sectionColor}10`, borderRadius: 5, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, borderLeft: `3px solid ${sectionColor}60` }}>
                      {task.whyImportant}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active step content */}
            {currentStepDef && activeStep !== '_risks' && activeStep !== '_evidence' && activeStep !== '_artifact' && activeStep !== '_finish' && (
              <StepContent
                step={currentStepDef}
                answer={ws.answers[activeStep] ?? ''}
                onChange={v => updateAnswer(activeStep, v)}
                sectionColor={sectionColor}
                aiLoading={aiLoading === 'analyse'}
              />
            )}

            {/* Risks & Assumptions step */}
            {activeStep === '_risks' && (
              <RisksStep
                riskRows={ws.riskRows}
                assumptions={ws.assumptions}
                onChangeRisks={rows => setWs(prev => ({ ...prev, riskRows: rows }))}
                onChangeAssumptions={assumptions => setWs(prev => ({ ...prev, assumptions }))}
                sectionColor={sectionColor}
              />
            )}

            {/* Evidence step */}
            {activeStep === '_evidence' && (
              <EvidenceStep
                evidenceRequired={task.evidenceRequired ?? ''}
                status={ws.evidenceStatus}
                location={ws.evidenceLocation}
                onChangeStatus={s => setWs(prev => ({ ...prev, evidenceStatus: s }))}
                onChangeLocation={l => setWs(prev => ({ ...prev, evidenceLocation: l }))}
                sectionColor={sectionColor}
              />
            )}

            {/* Artifact step */}
            {activeStep === '_artifact' && (
              <ArtifactStep
                artifact={ws.artifact}
                generatedAt={ws.artifactGeneratedAt}
                onEdit={v => setWs(prev => ({ ...prev, artifact: v }))}
                onRegenerate={handleDraft}
                onExportToBP={handleToBP}
                bpChapter={bpChapter}
                aiLoading={aiLoading === 'draft'}
                sectionColor={sectionColor}
                lang={lang}
              />
            )}

            {/* Finish step */}
            {activeStep === '_finish' && (
              <FinishStep
                task={task}
                answeredCount={answeredCount}
                totalSteps={allSteps.length}
                hasArtifact={!!ws.artifact}
                evidenceStatus={ws.evidenceStatus}
                canFinish={canFinish}
                onFinish={handleFinish}
                onStatusChange={handleStatusChange}
                saving={saving}
                sectionColor={sectionColor}
                lang={lang}
              />
            )}

            {/* Navigation arrows */}
            {activeStep && (
              <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {allSteps.findIndex(s => s.id === activeStep) > 0 && (
                  <button
                    onClick={() => {
                      const idx = allSteps.findIndex(s => s.id === activeStep);
                      setActiveStep(allSteps[idx - 1].id);
                    }}
                    style={{ padding: '7px 14px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Ic name="chevL" size={11} /> Zurück
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {allSteps.findIndex(s => s.id === activeStep) < allSteps.length - 1 && (
                  <button
                    onClick={() => {
                      const idx = allSteps.findIndex(s => s.id === activeStep);
                      setActiveStep(allSteps[idx + 1].id);
                    }}
                    style={{ padding: '7px 16px', borderRadius: 6, background: sectionColor, border: 'none', color: '#0d0f1a', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    Weiter <Ic name="chevR" size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t(lang, 'cb_ws_notes')}</div>
              <textarea
                value={ws.notes}
                onChange={e => setWs(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Persönliche Notizen, Gedanken, offene Fragen…"
                style={{
                  width: '100%', minHeight: 72, padding: '8px 10px', boxSizing: 'border-box',
                  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
                  color: 'var(--text-3)', fontSize: 11.5, fontFamily: 'inherit', lineHeight: 1.5,
                  resize: 'vertical', outline: 'none',
                }}
              />
            </div>

          </div>
        </div>

        {/* Right advisor panel */}
        <div style={{
          width: 260, flexShrink: 0, borderLeft: '1px solid var(--border)',
          overflowY: 'auto', padding: '16px 14px',
          background: 'var(--surface-2)',
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Ic name="sparkle" size={11} color={sectionColor} /> {t(lang, 'cb_ws_advisor_panel')}
          </div>

          {/* Current step advisor note */}
          {currentStepDef?.advisorNote && (
            <div style={{ marginBottom: 12, padding: '10px 12px', background: `${sectionColor}10`, borderRadius: 6, borderLeft: `3px solid ${sectionColor}60` }}>
              <div style={{ fontSize: 10, color: sectionColor, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aktueller Schritt</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{currentStepDef.advisorNote}</div>
            </div>
          )}

          {/* Hint for current step */}
          {currentStepDef?.hint && (
            <div style={{ marginBottom: 12, padding: '8px 10px', background: 'var(--surface-3)', borderRadius: 5 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>💡 {currentStepDef.hint}</div>
            </div>
          )}

          {/* Section advisor tips */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Für diesen Bereich</div>
            {advisorTips.map((tip, i) => (
              <div key={i} style={{ marginBottom: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 5, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5, borderLeft: '2px solid var(--border-2)' }}>
                {tip}
              </div>
            ))}
          </div>

          {/* External advisor */}
          {task.externalAdvisor && (
            <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(52,211,153,0.08)', borderRadius: 6, border: '1px solid rgba(52,211,153,0.2)' }}>
              <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Externer Berater</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>⚖️ {task.externalAdvisor}</div>
              <button
                onClick={handleAdvisorLetter}
                disabled={aiLoading === 'letter'}
                style={{ marginTop: 6, width: '100%', padding: '5px 0', borderRadius: 5, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
              >
                Brief erstellen
              </button>
            </div>
          )}

          {/* Evidence status */}
          {task.evidenceRequired && (
            <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 5, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{t(lang, 'cb_ws_evidence')}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginBottom: 5 }}>{task.evidenceRequired}</div>
              <div style={{ fontSize: 11, color: ws.evidenceStatus === 'vorhanden' || ws.evidenceStatus === 'extern_geprueft' ? '#10b981' : '#f59e0b' }}>
                {ws.evidenceStatus === 'fehlt' ? '✗ Fehlt noch' : ws.evidenceStatus === 'in_bearbeitung' ? '⏳ In Bearbeitung' : ws.evidenceStatus === 'vorhanden' ? '✓ Vorhanden' : '✓ Extern geprüft'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const StepContent = ({ step, answer, onChange, sectionColor, aiLoading }: {
  step: WorkspaceStep; answer: string; onChange: (v: string) => void; sectionColor: string; aiLoading: boolean;
}) => (
  <div>
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>{step.label}</h3>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{step.question}</p>
    </div>
    <div style={{ position: 'relative' }}>
      <textarea
        value={answer}
        onChange={e => onChange(e.target.value)}
        placeholder="Deine Antwort, Entscheidung, Analyse oder Dokumentation…"
        style={{
          width: '100%', minHeight: 180, padding: '12px 14px', boxSizing: 'border-box',
          background: 'var(--bg)', border: `1px solid ${answer.trim() ? sectionColor + '50' : 'var(--border)'}`,
          borderRadius: 8, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
          lineHeight: 1.65, resize: 'vertical', outline: 'none', transition: 'border-color 0.2s',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = sectionColor)}
        onBlur={e => (e.currentTarget.style.borderColor = answer.trim() ? sectionColor + '50' : 'var(--border)')}
      />
      {aiLoading && (
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: sectionColor }}>
          KI analysiert…
        </div>
      )}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
      <span style={{ fontSize: 10, color: answer.trim() ? '#10b981' : 'var(--text-4)' }}>
        {answer.trim() ? '✓ Beantwortet' : '○ Noch offen'}
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{answer.length} Zeichen</span>
    </div>
  </div>
);

const RisksStep = ({ riskRows, assumptions, onChangeRisks, onChangeAssumptions, sectionColor }: {
  riskRows: RiskRow[]; assumptions: WsAssumption[];
  onChangeRisks: (r: RiskRow[]) => void; onChangeAssumptions: (a: WsAssumption[]) => void;
  sectionColor: string;
}) => {
  const addRisk = () => onChangeRisks([...riskRows, { id: `r${Date.now()}`, risk: '', probability: 'mittel', impact: 'mittel', mitigation: '' }]);
  const updateRisk = (id: string, patch: Partial<RiskRow>) => onChangeRisks(riskRows.map(r => r.id === id ? { ...r, ...patch } : r));
  const removeRisk = (id: string) => onChangeRisks(riskRows.filter(r => r.id !== id));

  const addAssumption = () => onChangeAssumptions([...assumptions, { id: `a${Date.now()}`, text: '', status: 'ungeprüft' }]);
  const updateAssumption = (id: string, patch: Partial<WsAssumption>) => onChangeAssumptions(assumptions.map(a => a.id === id ? { ...a, ...patch } : a));
  const removeAssumption = (id: string) => onChangeAssumptions(assumptions.filter(a => a.id !== id));

  const probColors: Record<string, string> = { hoch: '#ef4444', mittel: '#f59e0b', niedrig: '#10b981' };
  const assumptionColors: Record<WsAssumption['status'], string> = { ungeprüft: '#9ca3af', recherchiert: '#f59e0b', validiert: '#60a5fa', bestätigt: '#10b981', widerlegt: '#ef4444' };

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Risiken & Annahmen</h3>

      {/* Risk table */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Risiken ({riskRows.length})</span>
          <button onClick={addRisk} style={{ padding: '3px 10px', borderRadius: 5, background: `${sectionColor}15`, border: `1px solid ${sectionColor}40`, color: sectionColor, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Risiko</button>
        </div>
        {riskRows.length === 0 ? (
          <div style={{ fontSize: 11.5, color: 'var(--text-4)', fontStyle: 'italic', padding: '8px 0' }}>Noch keine Risiken dokumentiert.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {riskRows.map(r => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 1fr 24px', gap: 6, alignItems: 'center' }}>
                <input value={r.risk} onChange={e => updateRisk(r.id, { risk: e.target.value })} placeholder="Risiko" style={{ padding: '5px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', fontSize: 11.5, fontFamily: 'inherit', outline: 'none' }} />
                <select value={r.probability} onChange={e => updateRisk(r.id, { probability: e.target.value as RiskRow['probability'] })} style={{ padding: '5px 4px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: probColors[r.probability], fontSize: 11, fontFamily: 'inherit', outline: 'none', fontWeight: 600 }}>
                  <option value="hoch">Hoch</option><option value="mittel">Mittel</option><option value="niedrig">Niedrig</option>
                </select>
                <select value={r.impact} onChange={e => updateRisk(r.id, { impact: e.target.value as RiskRow['impact'] })} style={{ padding: '5px 4px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: probColors[r.impact], fontSize: 11, fontFamily: 'inherit', outline: 'none', fontWeight: 600 }}>
                  <option value="hoch">Hoch</option><option value="mittel">Mittel</option><option value="niedrig">Niedrig</option>
                </select>
                <input value={r.mitigation} onChange={e => updateRisk(r.id, { mitigation: e.target.value })} placeholder="Gegenmaßnahme" style={{ padding: '5px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', fontSize: 11.5, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={() => removeRisk(r.id)} style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.5)', cursor: 'pointer', padding: 0, fontSize: 14 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assumptions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Annahmen ({assumptions.length})</span>
          <button onClick={addAssumption} style={{ padding: '3px 10px', borderRadius: 5, background: `${sectionColor}15`, border: `1px solid ${sectionColor}40`, color: sectionColor, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Annahme</button>
        </div>
        {assumptions.length === 0 ? (
          <div style={{ fontSize: 11.5, color: 'var(--text-4)', fontStyle: 'italic', padding: '8px 0' }}>Noch keine Annahmen dokumentiert. Gute Businesspläne machen Annahmen explizit.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {assumptions.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: assumptionColors[a.status], flexShrink: 0 }} />
                <input value={a.text} onChange={e => updateAssumption(a.id, { text: e.target.value })} placeholder="z.B. Käufer akzeptieren 7,50 €/kg für Tansania Arabica" style={{ flex: 1, padding: '5px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', fontSize: 11.5, fontFamily: 'inherit', outline: 'none' }} />
                <select value={a.status} onChange={e => updateAssumption(a.id, { status: e.target.value as WsAssumption['status'] })} style={{ padding: '4px 6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: assumptionColors[a.status], fontSize: 11, fontFamily: 'inherit', outline: 'none', fontWeight: 600 }}>
                  <option value="ungeprüft">Ungeprüft</option><option value="recherchiert">Recherchiert</option><option value="validiert">Validiert</option><option value="bestätigt">Bestätigt</option><option value="widerlegt">Widerlegt</option>
                </select>
                <button onClick={() => removeAssumption(a.id)} style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.5)', cursor: 'pointer', padding: 0, fontSize: 14 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EvidenceStep = ({ evidenceRequired, status, location, onChangeStatus, onChangeLocation, sectionColor }: {
  evidenceRequired: string; status: WorkspaceState['evidenceStatus']; location: string;
  onChangeStatus: (s: WorkspaceState['evidenceStatus']) => void; onChangeLocation: (l: string) => void;
  sectionColor: string;
}) => (
  <div>
    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Nachweise & Dokumente</h3>
    {evidenceRequired ? (
      <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(96,165,250,0.08)', borderRadius: 6, border: '1px solid rgba(96,165,250,0.2)' }}>
        <div style={{ fontSize: 10.5, color: '#60a5fa', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Erforderlicher Nachweis</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{evidenceRequired}</div>
      </div>
    ) : (
      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-3)' }}>Welche Dokumente, Bestätigungen oder Nachweise werden für diese Aufgabe benötigt?</p>
    )}
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Status</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['fehlt', 'in_bearbeitung', 'vorhanden', 'extern_geprueft'] as const).map(s => (
            <button key={s} onClick={() => onChangeStatus(s)} style={{
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11.5, fontWeight: status === s ? 700 : 400,
              background: status === s ? `${sectionColor}20` : 'transparent',
              border: `1px solid ${status === s ? sectionColor : 'var(--border)'}`,
              color: status === s ? sectionColor : 'var(--text-3)',
            }}>
              {s === 'fehlt' ? '✗ Fehlt' : s === 'in_bearbeitung' ? '⏳ In Arbeit' : s === 'vorhanden' ? '✓ Vorhanden' : '✓ Extern geprüft'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Wo liegt das Dokument?</label>
        <input value={location} onChange={e => onChangeLocation(e.target.value)} placeholder="z.B. Google Drive / Ordner Gründung / EORI-Bestätigung.pdf" style={{ width: '100%', padding: '8px 10px', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }} />
      </div>
    </div>
  </div>
);

const ArtifactStep = ({ artifact, generatedAt, onEdit, onRegenerate, onExportToBP, bpChapter, aiLoading, sectionColor, lang }: {
  artifact: string; generatedAt?: string; onEdit: (v: string) => void;
  onRegenerate: () => void; onExportToBP: () => void; bpChapter?: string;
  aiLoading: boolean; sectionColor: string; lang: Lang;
}) => {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{t(lang, 'cb_ws_artifact')}</h3>
        {generatedAt && <span style={{ fontSize: 10, color: 'var(--text-4)' }}>Erstellt: {new Date(generatedAt).toLocaleDateString('de-DE')}</span>}
      </div>
      {artifact ? (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setEditing(e => !e)} style={{ padding: '4px 10px', borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 11 }}>
              {editing ? 'Vorschau' : '✏️ Bearbeiten'}
            </button>
            <button onClick={onRegenerate} disabled={aiLoading} style={{ padding: '4px 10px', borderRadius: 5, background: `${sectionColor}15`, border: `1px solid ${sectionColor}40`, color: sectionColor, cursor: aiLoading ? 'default' : 'pointer', fontSize: 11 }}>
              {aiLoading ? 'Generiert…' : '↻ Neu generieren'}
            </button>
            {bpChapter && (
              <button onClick={onExportToBP} style={{ padding: '4px 10px', borderRadius: 5, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                → In Businessplan übernehmen
              </button>
            )}
          </div>
          {editing ? (
            <textarea value={artifact} onChange={e => onEdit(e.target.value)} style={{ width: '100%', minHeight: 320, padding: '12px', boxSizing: 'border-box', background: 'var(--bg)', border: `1px solid ${sectionColor}50`, borderRadius: 8, color: 'var(--text)', fontSize: 12.5, fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />
          ) : (
            <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, borderLeft: `4px solid ${sectionColor}` }}>
              {artifact.split('\n').map((line, i) => (
                <p key={i} style={{ margin: '0 0 8px', fontSize: 12.5, lineHeight: 1.7, color: line.startsWith('##') || line.startsWith('**') ? 'var(--text)' : 'var(--text-2)', fontWeight: line.startsWith('##') ? 700 : 400 }}>
                  {line || <br />}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>Noch kein Ergebnis-Dokument erstellt.</div>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-4)', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
            Beantworte die Schritte links und klicke dann &quot;KI-Entwurf&quot; oben rechts — die KI erstellt aus deinen Antworten ein professionelles Dokument.
          </p>
          <button onClick={onRegenerate} disabled={aiLoading} style={{ padding: '8px 20px', borderRadius: 7, background: sectionColor, border: 'none', color: '#0d0f1a', cursor: aiLoading ? 'default' : 'pointer', fontSize: 12.5, fontWeight: 700 }}>
            {aiLoading ? 'Generiert…' : '✨ Jetzt Entwurf erstellen'}
          </button>
        </div>
      )}
    </div>
  );
};

const FinishStep = ({ task, answeredCount, totalSteps, hasArtifact, evidenceStatus, canFinish, onFinish, onStatusChange, saving, sectionColor, lang }: {
  task: SetupTask; answeredCount: number; totalSteps: number; hasArtifact: boolean;
  evidenceStatus: WorkspaceState['evidenceStatus']; canFinish: boolean;
  onFinish: () => void; onStatusChange: (s: CBStatus) => Promise<void>;
  saving: boolean; sectionColor: string; lang: Lang;
}) => {
  const checks = [
    { label: `${answeredCount}/${totalSteps} Schritte beantwortet`, ok: answeredCount >= Math.ceil(totalSteps * 0.5) },
    { label: 'Ergebnis-Dokument erstellt', ok: hasArtifact },
    { label: 'Nachweis vorhanden', ok: evidenceStatus === 'vorhanden' || evidenceStatus === 'extern_geprueft' },
  ];
  const isDone = task.status === 'done';

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Abschluss & Freigabe</h3>
      <div style={{ marginBottom: 20 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 6, borderRadius: 6, background: c.ok ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${c.ok ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
            <span style={{ fontSize: 14 }}>{c.ok ? '✓' : '○'}</span>
            <span style={{ fontSize: 12.5, color: c.ok ? '#10b981' : 'var(--text-3)' }}>{c.label}</span>
          </div>
        ))}
      </div>
      {isDone ? (
        <div style={{ padding: '14px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.25)', textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>Aufgabe erledigt</div>
          <button onClick={() => onStatusChange('in_progress')} style={{ marginTop: 8, padding: '4px 12px', borderRadius: 5, background: 'none', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer', fontSize: 11 }}>
            Wieder öffnen
          </button>
        </div>
      ) : (
        <button
          onClick={onFinish}
          disabled={!canFinish || saving}
          style={{
            width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: canFinish && !saving ? 'pointer' : 'default',
            background: canFinish ? sectionColor : 'var(--surface-3)', border: 'none',
            color: canFinish ? '#0d0f1a' : 'var(--text-4)', transition: 'all 0.2s',
          }}
        >
          {saving ? 'Wird gespeichert…' : canFinish ? t(lang, 'cb_ws_finish') : 'Pflichtfelder noch ausstehend'}
        </button>
      )}
      {!canFinish && !isDone && (
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--text-4)', textAlign: 'center' }}>
          Mindestens 50% der Schritte und das Ergebnis-Dokument müssen ausgefüllt sein.
        </p>
      )}
    </div>
  );
};
