/**
 * iCal Fetcher - Récupère et parse les flux iCal Airbnb
 * 
 * Ce module gère la récupération et le parsing des calendriers iCal depuis Airbnb.
 * Il extrait les réservations (dates bloquées) et les transforme en objets Partial_Reservation.
 */

import { parseISO, isValid } from 'date-fns';

/**
 * Interface pour une réservation partielle (iCal uniquement)
 * Contient uniquement les dates, sans détails clients
 */
export interface PartialReservation {
  external_id: string;        // UID de l'événement iCal
  check_in_date: Date;         // Date de check-in
  check_out_date: Date;        // Date de check-out
  summary?: string;            // Résumé de l'événement (optionnel)
  raw_ical?: string;           // Données iCal brutes pour debugging
}

/**
 * Interface pour le résultat du fetch iCal
 */
export interface ICalFetchResult {
  success: boolean;
  reservations: PartialReservation[];
  error?: string;
  url: string;
  fetchedAt: Date;
}

/**
 * Parse une date iCal (format: YYYYMMDD ou YYYYMMDDTHHMMSSZ)
 */
function parseICalDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Nettoyer la chaîne (enlever les préfixes comme "VALUE=DATE:")
  const cleanDate = dateStr.replace(/^[^:]*:/, '').trim();

  // Format: YYYYMMDD
  if (cleanDate.length === 8) {
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1; // Mois commence à 0
    const day = parseInt(cleanDate.substring(6, 8));
    const date = new Date(year, month, day);
    return isValid(date) ? date : null;
  }

  // Format: YYYYMMDDTHHMMSSZ
  if (cleanDate.length >= 15) {
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1;
    const day = parseInt(cleanDate.substring(6, 8));
    const date = new Date(Date.UTC(year, month, day));
    return isValid(date) ? date : null;
  }

  // Fallback: essayer parseISO
  try {
    const date = parseISO(cleanDate);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Parse le contenu iCal et extrait les événements VEVENT
 */
function parseICalContent(icalContent: string): PartialReservation[] {
  const reservations: PartialReservation[] = [];
  
  // Split par VEVENT
  const events = icalContent.split('BEGIN:VEVENT');
  
  for (let i = 1; i < events.length; i++) {
    const eventBlock = events[i].split('END:VEVENT')[0];
    
    // Extraire les champs
    let uid = '';
    let dtstart = '';
    let dtend = '';
    let summary = '';
    
    const lines = eventBlock.split(/\r?\n/);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('UID:')) {
        uid = trimmedLine.substring(4).trim();
      } else if (trimmedLine.startsWith('DTSTART')) {
        dtstart = trimmedLine.split(':')[1]?.trim() || '';
      } else if (trimmedLine.startsWith('DTEND')) {
        dtend = trimmedLine.split(':')[1]?.trim() || '';
      } else if (trimmedLine.startsWith('SUMMARY:')) {
        summary = trimmedLine.substring(8).trim();
      }
    }
    
    // Valider et créer la réservation
    if (uid && dtstart && dtend) {
      const checkInDate = parseICalDate(dtstart);
      const checkOutDate = parseICalDate(dtend);
      
      if (checkInDate && checkOutDate && checkInDate < checkOutDate) {
        reservations.push({
          external_id: uid,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          summary: summary || undefined,
          raw_ical: eventBlock.substring(0, 500), // Limiter à 500 chars
        });
      }
    }
  }
  
  return reservations;
}

/**
 * Récupère et parse un flux iCal depuis une URL
 * 
 * @param icalUrl - URL du flux iCal Airbnb
 * @param options - Options de fetch (timeout, retry, etc.)
 * @returns Résultat contenant les réservations parsées
 * 
 * @example
 * ```typescript
 * const result = await fetchAndParseICal('https://airbnb.com/calendar/ical/xxx.ics');
 * if (result.success) {
 *   console.log(`${result.reservations.length} réservations trouvées`);
 * }
 * ```
 */
export async function fetchAndParseICal(
  icalUrl: string,
  options: {
    timeout?: number;      // Timeout en ms (défaut: 10000)
    retries?: number;      // Nombre de retries (défaut: 3)
    retryDelay?: number;   // Délai entre retries en ms (défaut: 2000)
  } = {}
): Promise<ICalFetchResult> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 2000,
  } = options;

  const fetchedAt = new Date();
  let lastError: string = '';

  // Valider l'URL
  if (!icalUrl || !icalUrl.startsWith('http')) {
    return {
      success: false,
      reservations: [],
      error: 'URL iCal invalide',
      url: icalUrl,
      fetchedAt,
    };
  }

  // Retry loop
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Fetch avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(icalUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'LoftAlgerie-Sync/1.0',
        },
      });

      clearTimeout(timeoutId);

      // Vérifier le statut HTTP
      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        
        // Ne pas retry sur 404 (URL invalide)
        if (response.status === 404) {
          return {
            success: false,
            reservations: [],
            error: lastError,
            url: icalUrl,
            fetchedAt,
          };
        }
        
        // Retry sur autres erreurs
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        return {
          success: false,
          reservations: [],
          error: lastError,
          url: icalUrl,
          fetchedAt,
        };
      }

      // Récupérer le contenu
      const icalContent = await response.text();

      // Vérifier que c'est bien un iCal
      if (!icalContent.includes('BEGIN:VCALENDAR')) {
        return {
          success: false,
          reservations: [],
          error: 'Le contenu n\'est pas un fichier iCal valide',
          url: icalUrl,
          fetchedAt,
        };
      }

      // Parser le contenu
      const reservations = parseICalContent(icalContent);

      return {
        success: true,
        reservations,
        url: icalUrl,
        fetchedAt,
      };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = `Timeout après ${timeout}ms`;
        } else {
          lastError = error.message;
        }
      } else {
        lastError = 'Erreur inconnue';
      }

      // Retry avec backoff exponentiel
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
    }
  }

  // Tous les retries ont échoué
  return {
    success: false,
    reservations: [],
    error: `Échec après ${retries} tentatives: ${lastError}`,
    url: icalUrl,
    fetchedAt,
  };
}

/**
 * Récupère et parse plusieurs flux iCal en parallèle
 * 
 * @param icalUrls - Tableau d'URLs iCal
 * @param options - Options de fetch
 * @returns Tableau de résultats
 * 
 * @example
 * ```typescript
 * const urls = ['https://airbnb.com/calendar/ical/1.ics', 'https://airbnb.com/calendar/ical/2.ics'];
 * const results = await fetchMultipleICals(urls);
 * const successCount = results.filter(r => r.success).length;
 * ```
 */
export async function fetchMultipleICals(
  icalUrls: string[],
  options?: Parameters<typeof fetchAndParseICal>[1]
): Promise<ICalFetchResult[]> {
  return Promise.all(
    icalUrls.map(url => fetchAndParseICal(url, options))
  );
}

/**
 * Valide qu'une URL iCal est accessible
 * 
 * @param icalUrl - URL à valider
 * @returns true si l'URL est accessible, false sinon
 */
export async function validateICalUrl(icalUrl: string): Promise<boolean> {
  try {
    const result = await fetchAndParseICal(icalUrl, {
      timeout: 5000,
      retries: 1,
    });
    return result.success;
  } catch {
    return false;
  }
}
