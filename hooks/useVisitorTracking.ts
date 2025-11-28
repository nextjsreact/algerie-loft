/**
 * Hook de tracking des visiteurs - Version Light
 * 
 * Caractéristiques :
 * - Track une seule fois par session (pas chaque page)
 * - Léger et non-intrusif
 * - Respectueux de la vie privée
 * - Pas de cookies
 */

import { useEffect, useRef } from 'react';

interface VisitorTrackingOptions {
  enabled?: boolean;
  debug?: boolean;
}

export function useVisitorTracking(options: VisitorTrackingOptions = {}) {
  const { enabled = true, debug = false } = options;
  const hasTracked = useRef(false);

  useEffect(() => {
    // Ne tracker qu'une fois par session
    if (!enabled || hasTracked.current) {
      return;
    }

    // Vérifier si déjà tracké dans cette session
    const sessionTracked = sessionStorage.getItem('visitor_tracked');
    if (sessionTracked) {
      hasTracked.current = true;
      return;
    }

    // Générer un ID de session unique
    let sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitor_session_id', sessionId);
    }

    // Détecter le type d'appareil
    const getDeviceType = (): string => {
      if (typeof window === 'undefined') return 'unknown';
      
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
      }
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
      }
      return 'desktop';
    };

    // Détecter le navigateur
    const getBrowser = (): string => {
      if (typeof window === 'undefined') return 'unknown';
      
      const ua = navigator.userAgent;
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Edg')) return 'Edge';
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Opera')) return 'Opera';
      return 'Unknown';
    };

    // Enregistrer la visite
    const trackVisitor = async () => {
      try {
        const response = await fetch('/api/track-visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            referrer: document.referrer || null,
            landingPage: window.location.pathname,
            deviceType: getDeviceType(),
            browser: getBrowser(),
            os: navigator.platform || 'Unknown'
          })
        });

        if (response.ok) {
          // Marquer comme tracké pour cette session
          sessionStorage.setItem('visitor_tracked', 'true');
          hasTracked.current = true;
          
          if (debug) {
            console.log('[Visitor Tracking] Session tracked successfully');
          }
        } else {
          if (debug) {
            console.warn('[Visitor Tracking] Failed to track:', response.status);
          }
        }
      } catch (error) {
        // Silencieux - ne pas bloquer l'app si le tracking échoue
        if (debug) {
          console.error('[Visitor Tracking] Error:', error);
        }
      }
    };

    // Petit délai pour ne pas bloquer le rendu initial
    const timeoutId = setTimeout(trackVisitor, 1000);

    return () => clearTimeout(timeoutId);
  }, [enabled, debug]);
}
