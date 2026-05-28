'use client';

import React, { useState } from 'react';
import type { ServiceProvider } from '@/lib/types';
import { ServiceProvidersList } from './service_providers/ServiceProvidersList';
import { ServiceProviderDetail } from './service_providers/ServiceProviderDetail';

export const ServiceProvidersView = () => {
  const [selected, setSelected] = useState<ServiceProvider | null>(null);

  if (selected) {
    return (
      <ServiceProviderDetail
        provider={selected}
        onBack={() => setSelected(null)}
        onDeleted={() => setSelected(null)}
      />
    );
  }

  return <ServiceProvidersList onSelect={setSelected} />;
};
