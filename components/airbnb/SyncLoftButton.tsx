'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

interface SyncLoftButtonProps {
  listingId: string | number;
  loftTitle: string;
}

type SyncStatus = 'idle' | 'loading' | 'queued' | 'error';

export default function SyncLoftButton({ listingId, loftTitle }: SyncLoftButtonProps) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  const handleSync = useCallback(async () => {
    if (status === 'loading') return;
    setStatus('loading');

    try {
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;

      const res = await fetch('/api/airbnb/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          listing_id: listingId,
          reason: `Déclenché depuis la fiche réservation de ${loftTitle}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      setStatus('queued');
    } catch (err) {
      console.error('[SyncLoftButton] Erreur:', err);
      setStatus('error');
    }
  }, [listingId, loftTitle, supabase, status]);

  useEffect(() => {
    if (status === 'queued' || status === 'error') {
      const timer = setTimeout(() => setStatus('idle'), 6000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status === 'queued') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-600 font-medium">
          Synchro planifiée
        </span>
        <span className="text-xs text-muted-foreground">
          (30s → scraper, ~8 min pour mise à jour)
        </span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleSync}
      disabled={status === 'loading'}
      variant={status === 'error' ? 'destructive' : 'outline'}
      size="sm"
      className="gap-2"
    >
      {status === 'loading' ? (
        <>
          <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
          Planification...
        </>
      ) : status === 'error' ? (
        <>
          Erreur — Réessayer
        </>
      ) : (
        <>
          Sync Airbnb
        </>
      )}
    </Button>
  );
}
