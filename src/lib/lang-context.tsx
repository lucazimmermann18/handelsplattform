'use client';

import { createContext, useContext } from 'react';
import type { Lang } from './i18n';

export const LangContext = createContext<Lang>('de');
export const useLang = (): Lang => useContext(LangContext);
