# 🤖 Qu'est-ce que le Targeted Scraper ?

## 📋 Résumé en 30 secondes

C'est un **script Python automatique** qui :
1. Surveille les changements dans vos calendriers Airbnb (via iCal)
2. Scrape automatiquement les réservations quand il détecte un changement
3. Envoie les données à votre application Next.js

**Localisation :** `D:\Airbnb_transfer_v2\targeted_scraper.py`

---

## 🔍 Analyse de votre log

### Configuration actuelle

```
Targeted Scraper — Scraping ciblé sur demande
Poll interval : 30s          ← Vérifie toutes les 30 secondes
Moteur        : CloakBrowser ← Navigateur furtif
Headless      : True         ← Sans interface graphique
```

### Ce qui se passe

#### 1. **Détection des changements**
```
[13:54:24] Cycle 2 — 5 entree(s) en attente
Queue #10 — listing 1637669342598748246
Raison : ical_change
```

- Le scraper détecte que le calendrier iCal d'un loft a changé
- Il ajoute ce loft à la queue de scraping

#### 2. **Tentative API GraphQL (échoue)**
```
📋 Récupération des réservations (API GraphQL)...
⚠️  API GraphQL vide ou erreur
```

- Essaie d'abord l'API rapide d'Airbnb
- ❌ Échoue (Airbnb bloque souvent)

#### 3. **Fallback : Scraping manuel (réussit)**
```
🔄 Fallback : interception réseau + pagination...
⏳ Cela prendra 30-40 minutes pour scraper toutes les réservations...
```

- Navigue sur Airbnb comme un humain
- Intercepte les requêtes réseau
- Pagine à travers toutes les pages

#### 4. **Pagination massive**
```
📄 Page : upcoming...
Page 1: +40 (total cat: 106, cumul: 40)
Page 2: +40 (total cat: 106, cumul: 80)
Page 3: +26 (total cat: 106, cumul: 106)

📄 Page : completed...
Page 1: +40 (total cat: 5205, cumul: 146)
...
Page 131: +5 (total cat: 5205, cumul: 5311)

📄 Page : all...
Page 1: +13 (total cat: 6195, cumul: 5324)
...
Page 155: +6 (total cat: 6195, cumul: 6195)
```

**Résultat :** 6,195 réservations scrapées !

#### 5. **Problème : 0 réservation trouvée**
```
↳ 6195 réservations uniques (fallback)
0 reservations trouvees pour 617505721133092844
Aucune reservation — marquage done
```

**Pourquoi ?**
- Le scraper récupère TOUTES les réservations de votre compte
- Mais aucune ne correspond à ce listing spécifique
- C'est inefficace mais c'est la seule méthode qui fonctionne

---

## 🎯 Pourquoi c'est si lent ?

### Le problème

Pour chaque loft, le scraper :
1. Scrape **6,195 réservations** (toutes)
2. Filtre pour trouver celles du loft
3. Prend **30-40 minutes** par loft

**Avec 58 lofts :**
- 58 × 30 min = **29 heures** de scraping !
- 58 × 6,195 = **359,310 réservations** scrapées (avec beaucoup de doublons)

### Pourquoi il fait ça ?

L'API Airbnb ne permet pas de filtrer par listing facilement. Le scraper doit :
1. Récupérer tout
2. Filtrer après

---

## 🔄 Cycle de fonctionnement

```
┌─────────────────────────────────────┐
│  Cycle 1 : Attente (30s)            │
│  - Vérifie les iCal URLs            │
│  - Détecte les changements          │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Cycle 2 : Scraping (30-40 min)     │
│  - Lance CloakBrowser               │
│  - Scrape 6,195 réservations        │
│  - Filtre par listing               │
│  - Envoie à l'API Next.js           │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Cycle 3 : Attente (30s)            │
│  - Recommence                       │
└─────────────────────────────────────┘
```

---

## 📊 Architecture

```
┌─────────────────────────────────────┐
│  Targeted Scraper (Python)          │
│  D:\Airbnb_transfer_v2\             │
│  - targeted_scraper.py              │
│  - Surveille les iCal               │
│  - Détecte les changements          │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  CloakBrowser (Playwright)          │
│  - Navigue sur Airbnb               │
│  - Intercepte les requêtes          │
│  - Pagine (155 pages !)             │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  API Next.js                        │
│  http://localhost:3000/api/...      │
│  - Reçoit les réservations          │
│  - Met à jour la base de données    │
└─────────────────────────────────────┘
```

---

## ✅ Avantages

1. **Automatique** : Pas besoin d'intervention manuelle
2. **Temps réel** : Détecte les changements en 30 secondes
3. **Complet** : Récupère toutes les réservations
4. **Furtif** : CloakBrowser évite la détection Airbnb
5. **Session persistante** : Se connecte automatiquement

---

## ❌ Inconvénients

1. **Très lent** : 30-40 minutes par loft
2. **Inefficace** : Scrape 6,195 réservations pour en trouver quelques-unes
3. **Ressources** : Consomme beaucoup de CPU/RAM
4. **Fragile** : Peut casser si Airbnb change son interface
5. **Redondant** : Scrape les mêmes réservations plusieurs fois

---

## 🛠️ Comment l'arrêter ?

### Méthode 1 : Trouver le processus Python

```powershell
# Trouver le processus
Get-Process python

# Arrêter (remplacer PID par l'ID du processus)
Stop-Process -Id [PID] -Force
```

### Méthode 2 : Arrêter tous les processus Python

```powershell
Stop-Process -Name python -Force
```

### Méthode 3 : Fermer la fenêtre

Si le scraper tourne dans une fenêtre de terminal, fermez simplement la fenêtre.

---

## 🎯 Recommandations

### Option 1 : Arrêter le scraper automatique ⭐

**Pourquoi ?**
- Trop lent (29 heures pour 58 lofts)
- Trop inefficace (scrape tout plusieurs fois)
- Vous avez déjà 3,786 réservations importées

**Comment ?**
```powershell
Stop-Process -Name python -Force
```

### Option 2 : Optimiser la configuration

**Augmenter l'intervalle de polling :**
- Passer de 30s à 5 minutes
- Réduire la charge système

**Limiter le scraping :**
- Scraper seulement les réservations récentes
- Filtrer par date

### Option 3 : Utiliser le scraper manuel

**Avantages :**
- Vous contrôlez quand scraper
- Plus rapide (vous choisissez)
- Moins de ressources

**Comment ?**
```bash
python D:\Airbnb_transfer_v2\transform-and-send-airbnb-data.py [fichier_json]
```

---

## 📝 Fichiers impliqués

```
D:\Airbnb_transfer_v2\
├── targeted_scraper.py          ← Script principal
├── config/
│   └── settings.json            ← Configuration
├── output/
│   └── reservations_airbnb.json ← Données scrapées
└── logs/
    └── scraper.log              ← Logs
```

---

## 🔍 Logs importants

### Session valide
```
💾 Session trouvée : chargement...
✅ Session valide — connexion automatique !
```
→ Le scraper se connecte automatiquement à Airbnb

### Erreur de pagination
```
ERREUR: Element '[aria-label="Suivant"] >> nth=0' failed pointer_events check
```
→ Le bouton "Suivant" est caché, le scraper passe au suivant

### Warnings
```
DeprecationWarning: datetime.datetime.utcnow() is deprecated
```
→ Code Python obsolète, pas grave

---

## 💡 Que faire maintenant ?

### Recommandation : Arrêter le scraper

**Raisons :**
1. Vous avez déjà 3,786 réservations importées ✅
2. Le scraper est trop lent (29 heures)
3. Il consomme beaucoup de ressources
4. Il scrape les mêmes données plusieurs fois

**Comment arrêter :**
```powershell
Stop-Process -Name python -Force
```

### Alternative : Scraper manuel

Quand vous voulez synchroniser :
```bash
python D:\Airbnb_transfer_v2\transform-and-send-airbnb-data.py [fichier_json]
```

---

## 📊 Résumé

| Aspect | Détail |
|--------|--------|
| **Qu'est-ce que c'est ?** | Scraper Airbnb automatique |
| **Localisation** | `D:\Airbnb_transfer_v2\targeted_scraper.py` |
| **Fréquence** | Toutes les 30 secondes |
| **Durée par loft** | 30-40 minutes |
| **Réservations scrapées** | 6,195 (toutes) |
| **Efficacité** | ❌ Très faible |
| **Recommandation** | Arrêter et utiliser le scraper manuel |

---

## ❓ Questions fréquentes

### Q : Dois-je le laisser tourner ?
**R :** Non, vous avez déjà toutes vos réservations. Arrêtez-le.

### Q : Comment synchroniser les nouvelles réservations ?
**R :** Utilisez le scraper manuel quand vous en avez besoin.

### Q : Pourquoi c'est si lent ?
**R :** Il scrape TOUTES les réservations pour chaque loft (6,195 × 58).

### Q : Peut-on l'optimiser ?
**R :** Oui, mais c'est complexe. Plus simple d'utiliser le scraper manuel.

### Q : Va-t-il casser mon système ?
**R :** Non, mais il consomme beaucoup de CPU/RAM.

---

**Date :** 2026-05-31  
**Statut :** En cours d'exécution  
**Recommandation :** ⚠️ Arrêter le scraper automatique

