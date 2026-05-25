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
}

export const PROVIDER_META: ProviderMeta[] = [
  { id: 'anthropic', name: 'Anthropic',  logo: '◆', color: '#c084fc', docsUrl: 'https://console.anthropic.com/settings/keys',   keyPrefix: 'sk-ant-' },
  { id: 'openai',    name: 'OpenAI',     logo: '⬡', color: '#34d399', docsUrl: 'https://platform.openai.com/api-keys',          keyPrefix: 'sk-' },
  { id: 'deepseek',  name: 'DeepSeek',   logo: '⬢', color: '#60a5fa', docsUrl: 'https://platform.deepseek.com/api_keys',        keyPrefix: 'sk-' },
];

interface AiConfig {
  keys: Partial<Record<AiProvider, string>>;
  activeModel: string;
  setKey: (provider: AiProvider, key: string) => void;
  clearKey: (provider: AiProvider) => void;
  setActiveModel: (modelId: string) => void;
  activeModelObj: AiModel | undefined;
  hasKey: (provider: AiProvider) => boolean;
  isConfigured: boolean;
  generate: (prompt: string, systemPrompt?: string) => Promise<string>;
}

const AiConfigContext = createContext<AiConfig | null>(null);

const LS_KEYS  = 'eaos_ai_keys';
const LS_MODEL = 'eaos_ai_model';

export const AiConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [keys, setKeys] = useState<Partial<Record<AiProvider, string>>>({});
  const [activeModel, setActiveModelState] = useState<string>('claude-sonnet-4-6');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const k = localStorage.getItem(LS_KEYS);
      if (k) setKeys(JSON.parse(k));
      const m = localStorage.getItem(LS_MODEL);
      if (m) setActiveModelState(m);
    } catch { /* ignore parse errors */ }
    setReady(true);
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

  const hasKey = useCallback((provider: AiProvider) => !!keys[provider]?.trim(), [keys]);

  const activeModelObj = AI_MODELS.find(m => m.id === activeModel);
  const isConfigured   = !!(activeModelObj && hasKey(activeModelObj.provider));

  const generate = useCallback(async (prompt: string, systemPrompt?: string): Promise<string> => {
    if (!activeModelObj) throw new Error('Kein Modell ausgewählt');
    const key = keys[activeModelObj.provider];
    if (!key?.trim()) throw new Error(`Kein API-Key für ${activeModelObj.provider} hinterlegt`);

    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemPrompt,
        model: activeModel,
        provider: activeModelObj.provider,
        apiKey: key.trim(),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return (data.text as string) ?? '';
  }, [activeModel, activeModelObj, keys]);

  if (!ready) return null;

  return (
    <AiConfigContext.Provider value={{ keys, activeModel, setKey, clearKey, setActiveModel, activeModelObj, hasKey, isConfigured, generate }}>
      {children}
    </AiConfigContext.Provider>
  );
};

export const useAiConfig = () => {
  const ctx = useContext(AiConfigContext);
  if (!ctx) throw new Error('useAiConfig must be used within AiConfigProvider');
  return ctx;
};
