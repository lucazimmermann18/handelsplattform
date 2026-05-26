'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AiProvider = 'anthropic' | 'openai' | 'deepseek';

export interface AiModel {
  id: string;
  name: string;
  provider: AiProvider;
  description: string;
}

export const AI_MODELS: AiModel[] = [
  { id: 'claude-opus-4-7',             name: 'Claude Opus 4.7',   provider: 'anthropic', description: 'Stärkstes Modell · Komplex' },
  { id: 'claude-sonnet-4-6',           name: 'Claude Sonnet 4.6', provider: 'anthropic', description: 'Ausgewogen · Schnell' },
  { id: 'claude-haiku-4-5-20251001',   name: 'Claude Haiku 4.5',  provider: 'anthropic', description: 'Schnell · Günstig' },
  { id: 'gpt-4o',                      name: 'GPT-4o',            provider: 'openai',    description: 'Flagship · Multimodal' },
  { id: 'gpt-4o-mini',                 name: 'GPT-4o mini',       provider: 'openai',    description: 'Schnell · Günstig' },
  { id: 'gpt-4-turbo',                 name: 'GPT-4 Turbo',       provider: 'openai',    description: 'Großer Kontext' },
  { id: 'deepseek-chat',               name: 'DeepSeek V3',       provider: 'deepseek',  description: 'Ausgewogen · Open Source' },
  { id: 'deepseek-reasoner',           name: 'DeepSeek R1',       provider: 'deepseek',  description: 'Reasoning · CoT' },
];

export interface ProviderMeta {
  id: AiProvider;
  name: string;
  logo: string;
  color: string;
  docsUrl: string;
  keyPrefix: string;
  envVar: string;
}

export const PROVIDER_META: ProviderMeta[] = [
  { id: 'anthropic', name: 'Anthropic', logo: '◆', color: '#c084fc', docsUrl: 'https://console.anthropic.com/settings/keys',  keyPrefix: 'sk-ant-', envVar: 'ANTHROPIC_API_KEY' },
  { id: 'openai',    name: 'OpenAI',    logo: '⬡', color: '#34d399', docsUrl: 'https://platform.openai.com/api-keys',         keyPrefix: 'sk-',     envVar: 'OPENAI_API_KEY' },
  { id: 'deepseek',  name: 'DeepSeek',  logo: '⬢', color: '#60a5fa', docsUrl: 'https://platform.deepseek.com/api_keys',       keyPrefix: 'sk-',     envVar: 'DEEPSEEK_API_KEY' },
];

interface AiConfig {
  // localStorage keys (user-level fallback)
  keys: Partial<Record<AiProvider, string>>;
  setKey: (provider: AiProvider, key: string) => void;
  clearKey: (provider: AiProvider) => void;

  // server-side env status (true = key set in .env.local)
  envProviders: Partial<Record<AiProvider, boolean>>;

  // active model selection
  activeModel: string;
  setActiveModel: (modelId: string) => void;
  activeModelObj: AiModel | undefined;

  // derived helpers
  hasKey: (provider: AiProvider) => boolean;         // env OR localStorage
  isEnv: (provider: AiProvider) => boolean;          // env only
  isConfigured: boolean;                             // activeModel has any key

  generate: (prompt: string, systemPrompt?: string) => Promise<string>;
}

const AiConfigContext = createContext<AiConfig | null>(null);

const LS_KEYS  = 'eaos_ai_keys';
const LS_MODEL = 'eaos_ai_model';

export const AiConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [keys, setKeys]                   = useState<Partial<Record<AiProvider, string>>>({});
  const [activeModel, setActiveModelState] = useState<string>('claude-sonnet-4-6');
  const [envProviders, setEnvProviders]   = useState<Partial<Record<AiProvider, boolean>>>({});
  const [ready, setReady]                 = useState(false);

  useEffect(() => {
    let mounted = true;
    // Load localStorage settings
    try {
      const k = localStorage.getItem(LS_KEYS);
      if (k) setKeys(JSON.parse(k));
      const m = localStorage.getItem(LS_MODEL);
      if (m) setActiveModelState(m);
    } catch { /* ignore */ }

    // Fetch which providers have server-side env keys
    const controller = new AbortController();
    fetch('/api/ai/providers', { signal: controller.signal })
      .then(r => r.json())
      .then((data: Partial<Record<AiProvider, boolean>>) => { if (mounted) setEnvProviders(data); })
      .catch(() => { /* server unreachable — no env providers */ })
      .finally(() => { if (mounted) setReady(true); });

    return () => { mounted = false; controller.abort(); };
  }, []);

  const setKey = useCallback((provider: AiProvider, key: string) => {
    setKeys(prev => {
      const next = { ...prev, [provider]: key };
      localStorage.setItem(LS_KEYS, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearKey = useCallback((provider: AiProvider) => {
    setKeys(prev => {
      const next = { ...prev };
      delete next[provider];
      localStorage.setItem(LS_KEYS, JSON.stringify(next));
      return next;
    });
  }, []);

  const setActiveModel = useCallback((modelId: string) => {
    setActiveModelState(modelId);
    localStorage.setItem(LS_MODEL, modelId);
  }, []);

  const isEnv  = useCallback((p: AiProvider) => !!envProviders[p], [envProviders]);
  const hasKey = useCallback((p: AiProvider) => !!envProviders[p] || !!keys[p]?.trim(), [envProviders, keys]);

  const activeModelObj = AI_MODELS.find(m => m.id === activeModel);
  const isConfigured   = !!(activeModelObj && hasKey(activeModelObj.provider));

  const generate = useCallback(async (prompt: string, systemPrompt?: string): Promise<string> => {
    if (!activeModelObj) throw new Error('Kein Modell ausgewählt');
    if (!hasKey(activeModelObj.provider)) throw new Error(`Kein API-Key für ${activeModelObj.provider} konfiguriert`);

    // Send localStorage key if available; route prefers env var automatically
    const clientKey = keys[activeModelObj.provider]?.trim() ?? '';

    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemPrompt,
        model:    activeModel,
        provider: activeModelObj.provider,
        apiKey:   clientKey,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return (data.text as string) ?? '';
  }, [activeModel, activeModelObj, hasKey, keys]);

  if (!ready) return null;

  return (
    <AiConfigContext.Provider value={{
      keys, setKey, clearKey,
      envProviders,
      activeModel, setActiveModel, activeModelObj,
      hasKey, isEnv, isConfigured,
      generate,
    }}>
      {children}
    </AiConfigContext.Provider>
  );
};

export const useAiConfig = () => {
  const ctx = useContext(AiConfigContext);
  if (!ctx) throw new Error('useAiConfig must be used within AiConfigProvider');
  return ctx;
};
