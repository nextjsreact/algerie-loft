# Loft Algérie — Présentation Technique
## Architecture & Stack Technologique

---

## 1. Vue d'ensemble

**Loft Algérie** est une plateforme SaaS de gestion de locations courte durée, développée avec les technologies web modernes les plus performantes du marché. Elle couvre l'intégralité du cycle de vie d'une location : de la réservation client jusqu'à la gestion opérationnelle des équipes terrain.

---

## 2. Stack Technologique

### Frontend
| Technologie | Version | Rôle |
|-------------|---------|------|
| **Next.js** | 15 (App Router) | Framework React full-stack, SSR/SSG/ISR |
| **React** | 19 | UI Library |
| **TypeScript** | 5 | Typage statique, robustesse du code |
| **Tailwind CSS** | 3 | Styling utility-first, dark mode natif |
| **next-intl** | 3 | Internationalisation (FR / EN / AR) |
| **Framer Motion** | — | Animations fluides |
| **Radix UI / shadcn** | — | Composants accessibles (WCAG) |
| **Recharts** | — | Graphiques et visualisations |
| **date-fns** | — | Manipulation des dates |
| **Sonner / React Hot Toast** | — | Notifications temps réel |

### Backend
| Technologie | Version | Rôle |
|-------------|---------|------|
| **Next.js API Routes** | 15 | REST API serverless |
| **Supabase** | — | BaaS : PostgreSQL + Auth + Storage + Realtime |
| **PostgreSQL** | 15 | Base de données relationnelle |
| **Row Level Security (RLS)** | — | Sécurité au niveau des données |
| **Sharp** | 0.34 | Traitement d'images (conversion HEIC→JPEG, resize) |
| **Telegram Bot API** | — | Notifications planning équipe |

### Infrastructure & DevOps
| Service | Rôle |
|---------|------|
| **Vercel** | Hébergement, CI/CD automatique depuis GitHub |
| **GitHub** | Versioning, branches, pull requests |
| **Supabase Storage** | Stockage des photos (CDN global) |
| **Vercel Edge Network** | CDN mondial, latence minimale |

---

## 3. Architecture Applicative

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│         React 19 + Next.js 15 App Router            │
│    Server Components + Client Components + Hooks     │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                  VERCEL EDGE                         │
│         Next.js API Routes (Serverless)              │
│    Middleware Auth + Route Protection + i18n         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   SUPABASE                           │
│  PostgreSQL 15 │ Auth │ Storage │ Realtime           │
│  Row Level Security sur toutes les tables            │
└─────────────────────────────────────────────────────┘
```

### Patterns architecturaux
- **Multi-tenant par rôle** : un même utilisateur peut être client, partenaire ou employé selon son contexte de connexion (`login_context` cookie)
- **Server Actions désactivées** côté client → toutes les mutations passent par des API Routes REST pour éviter les erreurs 500
- **Service Role** utilisé dans les API Routes pour bypasser RLS de façon contrôlée
- **Optimistic UI** : les mises à jour s'affichent immédiatement avant confirmation serveur

---

## 4. Modèle de Données

### Tables principales (PostgreSQL)

```
lofts                    → Propriétés (lofts)
├── loft_photos          → Photos (Supabase Storage)
├── loft_availability    → Disponibilités et blocages
├── pricing_rules        → Règles de tarification
└── loft_availability    → Calendrier de disponibilité

reservations             → Réservations clients
├── reservation_payments → Paiements associés
└── reservation_reviews  → Avis clients

profiles                 → Utilisateurs (auth.users)
├── owners               → Propriétaires partenaires
├── teams                → Équipes opérationnelles
└── team_members         → Membres d'équipes

transactions             → Transactions financières
├── original_amount      → Montant en devise originale
└── original_currency    → Devise (DZD, EUR, USD...)

tasks                    → Tâches opérationnelles
notifications            → Notifications système
audit_logs               → Historique des actions
```

### Sécurité des données
- **RLS activé** sur toutes les tables sensibles
- **Service Role** uniquement côté serveur (jamais exposé au client)
- **JWT** pour l'authentification (Supabase Auth)
- **Middleware Next.js** pour la protection des routes

---

## 5. Fonctionnalités Techniques Avancées

### Gestion des images
- Upload multi-format : JPEG, PNG, WebP, **HEIC/HEIF** (conversion automatique)
- Optimisation automatique : redimensionnement si > 4000px
- CDN Supabase Storage avec cache 1 an
- `next/image` avec `placeholder="blur"` pour UX optimale

### Internationalisation (i18n)
- 3 langues : Français, Anglais, Arabe (RTL)
- Routing automatique : `/fr/`, `/en/`, `/ar/`
- Traductions complètes via `next-intl`

### Performance
- **Server Components** pour le rendu initial (0 JS côté client)
- **Code splitting** automatique par route
- **Virtualisation** des listes longues (`@tanstack/react-virtual`)
- **SWR** pour le cache et la revalidation des données
- Score Lighthouse > 90 en production

### Temps réel
- Supabase Realtime pour les mises à jour live
- WebSocket pour les notifications instantanées

---

## 6. Sécurité

| Mesure | Implémentation |
|--------|---------------|
| Authentification | Supabase Auth (JWT + PKCE flow) |
| Autorisation | RLS PostgreSQL + Middleware Next.js |
| Rôles | admin, manager, executive, superuser, member, client, partner |
| Protection CSRF | Next.js built-in |
| Headers sécurité | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| Données sensibles | Variables d'environnement Vercel (jamais dans le code) |
| Service Role | Uniquement côté serveur, jamais exposé |

---

## 7. CI/CD & Déploiement

```
Developer → git push → GitHub → Vercel (auto-deploy)
                                    ↓
                              Build Next.js
                                    ↓
                           Tests & Type Check
                                    ↓
                          Deploy to Production
                         (www.loftalgerie.com)
```

- **Déploiement automatique** à chaque push sur `main`
- **Preview deployments** pour chaque Pull Request
- **Rollback instantané** en cas de problème
- **Zero downtime** deployment

---

## 8. Métriques Techniques

| Métrique | Valeur |
|----------|--------|
| Temps de build | ~2 min |
| Time to First Byte (TTFB) | < 200ms |
| Tables PostgreSQL | 30+ |
| API Routes | 80+ endpoints |
| Composants React | 200+ |
| Lignes de code | ~50 000 |
| Langues supportées | 3 (FR/EN/AR) |

---

*Document généré le 21 avril 2026 — Loft Algérie Platform v2.0*
