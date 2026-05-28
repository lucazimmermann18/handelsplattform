'use client';

import React, { useState } from 'react';
import { BuyerFinderDashboard } from './buyers/BuyerFinderDashboard';
import { BuyerPipeline } from './buyers/BuyerPipeline';
import { BuyersList, BuyerDetail } from './Buyers';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { useData } from '@/lib/data-context';

type BFView =
  | { kind: 'dashboard' }
  | { kind: 'pipeline' }
  | { kind: 'list' }
  | { kind: 'detail'; id: string };

interface Props {
  lang: Lang;
}

export const BuyerFinderView = ({ lang }: Props) => {
  const [view, setView] = useState<BFView>({ kind: 'dashboard' });
  const { refresh } = useData();

  if (view.kind === 'detail') {
    return (
      <BuyerDetail
        id={view.id}
        lang={lang}
        onBack={() => setView({ kind: 'list' })}
      />
    );
  }

  if (view.kind === 'list') {
    return (
      <div>
        <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
          <button onClick={() => setView({ kind: 'dashboard' })}
            style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>
            {t(lang, 'bf_back_dash')}
          </button>
          <button onClick={() => setView({ kind: 'pipeline' })}
            style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', cursor: 'pointer', fontSize: 12 }}>
            {t(lang, 'bf_pipeline')}
          </button>
        </div>
        <BuyersList lang={lang} onOpen={(id) => setView({ kind: 'detail', id })} />
      </div>
    );
  }

  if (view.kind === 'pipeline') {
    return (
      <div>
        <div style={{ padding: '12px 24px 0', display: 'flex', gap: 8 }}>
          <button onClick={() => setView({ kind: 'dashboard' })}
            style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>
            {t(lang, 'bf_back_dash')}
          </button>
          <button onClick={() => setView({ kind: 'list' })}
            style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>
            {t(lang, 'bf_all_buyers')}
          </button>
        </div>
        <BuyerPipeline onBuyer={(id) => setView({ kind: 'detail', id })} onRefresh={refresh} />
      </div>
    );
  }

  return (
    <BuyerFinderDashboard
      onSection={(v) => setView({ kind: v })}
      onBuyer={(id) => setView({ kind: 'detail', id })}
    />
  );
};
