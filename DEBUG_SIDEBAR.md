# 🔍 Debug Double Sidebar

## Diagnostic

Ouvre la console du navigateur (F12) et exécute:

```javascript
// Compter les sidebars
document.querySelectorAll('[data-sidebar="partner-sidebar"]').length

// Voir tous les sidebars
document.querySelectorAll('[data-sidebar="partner-sidebar"]')

// Voir la structure
document.querySelectorAll('aside').forEach((el, i) => {
  console.log(`Sidebar ${i}:`, el.className)
})
```

## Si tu vois 2 sidebars

Cela signifie que le composant se rend deux fois. Causes possibles:
1. React Strict Mode (en développement)
2. Un composant parent qui wrap deux fois
3. Un problème de routing

## Solution Temporaire

Essaie d'ouvrir la page en mode incognito pour voir si le problème persiste.

## Vérification Visuelle

Dans les DevTools:
1. F12 → Elements
2. Cherche `<aside` dans le HTML
3. Compte combien il y en a
4. Regarde leur contenu

Si tu vois le même contenu dupliqué, c'est un problème de rendu React.
