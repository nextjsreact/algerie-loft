# Performance Baseline Report

**Date:** 2025-12-28T21:03:58.121Z
**Durée totale de l'analyse:** 1.39s

## Environnement
- **Node.js:** v20.19.1
- **Next.js:** 16.1.1
- **Plateforme:** win32
- **Mémoire utilisée:** 4.22 MB

## Métriques de Build
- **Temps de build:** -0.00s
- **Taille totale:** 0.00 MB
  - JavaScript: 0.00 MB
  - CSS: 0.00 KB
  - Images: 0.00 MB
  - Traductions: 0.00 KB

## Performance i18n
- **Temps de chargement moyen:** 5.41ms
- **Taille totale des traductions:** 526.21 KB
- **Locales supportées:** fr, en, ar

## Chemins Critiques
- **/** (Page d'accueil): ✅ 0.97ms
- **/auth/login** (Page de connexion): ✅ 0.48ms
- **/dashboard** (Tableau de bord): ❌ 0.43ms
- **/lofts** (Liste des lofts): ❌ 0.61ms
- **/reservations** (Gestion des réservations): ✅ 1.00ms

## Tests de Fonctionnalités
- **Supabase Client Initialization**: ✅ 0.65ms
- **Next-intl Configuration**: ✅ 0.52ms
- **Database Schema Validation**: ✅ 1.67ms
- **Radix UI Components**: ✅ 0.76ms
- **API Routes Functionality**: ✅ 0.30ms

## Dépendances
- **Total:** 124
- **Dépendances lourdes:** 4

## Recommandations
- 🌐 Implémenter le lazy loading des traductions par route
- 📦 Évaluer les alternatives plus légères pour les dépendances lourdes
- 🔍 Surveiller les Core Web Vitals après la migration
- 📊 Implémenter un monitoring continu des performances
- 🧪 Créer des tests de régression de performance

---
*Rapport généré automatiquement par le système de baseline de performance*
