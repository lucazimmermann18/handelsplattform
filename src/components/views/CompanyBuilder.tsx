'use client';

import React, { useState } from 'react';
import { CBDashboard } from './company_builder/CBDashboard';
import { CBSection } from './company_builder/CBSection';
import { CBGoLive } from './company_builder/CBGoLive';
import type { Lang } from '@/lib/i18n';

type CBView = { kind: 'dashboard' } | { kind: 'section'; key: string } | { kind: 'golive' };

interface Props { lang: Lang; }

export const CompanyBuilderView = ({ lang }: Props) => {
  const [view, setView] = useState<CBView>({ kind: 'dashboard' });

  if (view.kind === 'section') {
    return (
      <CBSection
        sectionKey={view.key}
        lang={lang}
        onBack={() => setView({ kind: 'dashboard' })}
      />
    );
  }

  if (view.kind === 'golive') {
    return (
      <CBGoLive
        lang={lang}
        onBack={() => setView({ kind: 'dashboard' })}
        onSection={(key) => setView({ kind: 'section', key })}
      />
    );
  }

  return (
    <CBDashboard
      lang={lang}
      onSection={(key) => setView({ kind: 'section', key })}
      onGoLive={() => setView({ kind: 'golive' })}
    />
  );
};
