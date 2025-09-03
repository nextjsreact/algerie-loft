import { useTranslation } from "@/lib/i18n/context";
import { getReservationTranslation } from "../reservations-translations";

export function useReservationsTranslation() {
  const { i18n } = useTranslation();
  const currentLang = i18n?.language || 'fr';
  
  const tr = (key: string) => {
    // Si la clé commence par "reservations.", utilise notre système
    if (key.startsWith('reservations.')) {
      return getReservationTranslation(key, currentLang);
    }
    // Sinon, utilise le système normal
    return key;
  };
  
  return { tr, currentLang };
}