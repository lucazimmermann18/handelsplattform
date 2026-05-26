'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: async () => {},
  isConfigured: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    // Dynamically import to avoid build errors when env vars are missing
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (mounted) {
          setUser(user);
          setLoading(false);
        }
      }).catch(() => {
        if (mounted) setLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) setUser(session?.user ?? null);
      });
      subscription = data.subscription;
    });

    return () => { mounted = false; subscription?.unsubscribe(); };
  }, [configured]);

  const signOut = async () => {
    if (!configured) return;
    const { createClient } = await import('@/lib/supabase/client');
    await createClient().auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isConfigured: configured }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
