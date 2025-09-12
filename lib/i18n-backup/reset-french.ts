
// Script de réinitialisation des cookies pour le français
export function resetToFrench() {
  if (typeof window !== 'undefined') {
    // Nettoyer tous les cookies de langue
    const cookiesToClear = ['language', 'i18nextLng', 'locale'];
    cookiesToClear.forEach(name => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
    
    // Définir le français
    document.cookie = 'language=fr; path=/; max-age=31536000; SameSite=Lax';
    document.cookie = 'i18nextLng=fr; path=/; max-age=31536000; SameSite=Lax';
    
    // LocalStorage
    try {
      localStorage.setItem('i18nextLng', 'fr');
      localStorage.setItem('language', 'fr');
    } catch(e) {}
    
    return true;
  }
  return false;
}

// Auto-exécution si dans le navigateur
if (typeof window !== 'undefined') {
  resetToFrench();
}
