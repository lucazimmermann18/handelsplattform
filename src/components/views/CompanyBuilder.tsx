'use client';

import React, { useState } from 'react';
import { CBDashboard } from './company_builder/CBDashboard';
import { CBSection } from './company_builder/CBSection';
import { CBGoLive } from './company_builder/CBGoLive';

type CBView = { kind: 'dashboard' } | { kind: 'section'; key: string } | { kind: 'golive' };

export const CompanyBuilderView = () => {
  const [view, setView] = useState<CBView>({ kind: 'dashboard' });

  if (view.kind === 'section') {
    return (
      <CBSection
        sectionKey={view.key}
        onBack={() => setView({ kind: 'dashboard' })}
      />
    );
  }

  if (view.kind === 'golive') {
    return (
      <CBGoLive
        onBack={() => setView({ kind: 'dashboard' })}
        onSection={(key) => setView({ kind: 'section', key })}
      />
    );
  }

  return (
    <CBDashboard
      onSection={(key) => setView({ kind: 'section', key })}
      onGoLive={() => setView({ kind: 'golive' })}
    />
  );
};
