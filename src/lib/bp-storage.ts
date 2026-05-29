// Shared BusinessPlan chapter storage — single source of truth for bp_chapters key

export interface BpAssumption {
  id: string;
  text: string;
  status: 'guess' | 'researched' | 'validated' | 'confirmed';
}

export interface BpChapterData {
  text: string;
  assumptions: BpAssumption[];
  updatedAt?: string;
}

export type BpChapterStore = Record<string, BpChapterData>;

const BP_KEY = 'bp_chapters';

export function loadBpChapters(): BpChapterStore {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(BP_KEY) ?? '{}'); } catch { return {}; }
}

export function saveBpChapters(store: BpChapterStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BP_KEY, JSON.stringify(store));
}

export function appendToBpChapter(chapterId: string, content: string, sourceLabel: string): void {
  const store = loadBpChapters();
  const existing = store[chapterId] ?? { text: '', assumptions: [] };
  const separator = existing.text.trim() ? '\n\n---\n' : '';
  const prefix = `[Aus Company Builder: ${sourceLabel}]\n`;
  store[chapterId] = {
    ...existing,
    text: existing.text + separator + prefix + content,
    updatedAt: new Date().toISOString(),
  };
  saveBpChapters(store);
}
