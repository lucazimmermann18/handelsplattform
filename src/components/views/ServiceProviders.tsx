'use client';

import React, { useState } from 'react';
import type { ServiceProvider } from '@/lib/types';
import { ServiceProvidersList } from './service_providers/ServiceProvidersList';
import { ServiceProviderDetail } from './service_providers/ServiceProviderDetail';
import type { Lang } from '@/lib/i18n';

interface Props { lang: Lang; }

export const ServiceProvidersView = ({ lang }: Props) => {
  const [selected, setSelected] = useState<ServiceProvider | null>(null);

  if (selected) {
    return (
      <ServiceProviderDetail
        provider={selected}
        lang={lang}
        onBack={() => setSelected(null)}
        onDeleted={() => setSelected(null)}
      />
    );
  }

  return <ServiceProvidersList lang={lang} onSelect={setSelected} />;
};
