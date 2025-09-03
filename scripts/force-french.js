// Script pour forcer le français et nettoyer les cookies
console.log('🇫🇷 Forçage de la langue française...');

// Supprimer tous les cookies de langue
document.cookie = 'language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
document.cookie = 'language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;';
document.cookie = 'language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;';

// Définir le français
document.cookie = 'language=fr; path=/; max-age=' + (60 * 60 * 24 * 365);

// Nettoyer le localStorage
localStorage.removeItem('language');
localStorage.removeItem('i18n-language');

// Nettoyer le sessionStorage
sessionStorage.clear();

console.log('✅ Langue française forcée. Rechargement...');

// Recharger la page
window.location.reload();