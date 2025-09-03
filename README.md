# 🏢 Loft Algeria - Système de Gestion Immobilière

Un système complet de gestion immobilière développé avec Next.js, TypeScript, et Supabase.

## 🌟 Fonctionnalités

### 🏠 Gestion des Lofts
- Création, modification et suppression de propriétés
- Gestion des photos et descriptions
- Système de traduction multilingue (FR, EN, AR)
- Filtrage avancé par statut, propriétaire, zone

### 📊 Tableau de Bord
- Vue d'ensemble des revenus et statistiques
- Graphiques interactifs
- Alertes et notifications

### 💰 Gestion Financière
- Suivi des transactions
- Gestion des factures et échéances
- Rapports PDF automatisés
- Multi-devises

### 👥 Gestion des Utilisateurs
- Système de rôles (Admin, Manager, Member, Executive)
- Équipes et assignation de tâches
- Conversations et messagerie

### 📅 Réservations
- Calendrier de disponibilité
- Gestion des réservations
- Intégration Airbnb

## 🛠️ Technologies

- **Frontend:** Next.js 15, React, TypeScript
- **Backend:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Authentification:** Supabase Auth
- **Internationalisation:** i18next
- **Charts:** Recharts
- **PDF:** jsPDF
- **UI Components:** Radix UI

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase

### Configuration

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/loft-algeria.git
cd loft-algeria
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration des variables d'environnement**
```bash
cp .env.example .env.local
```

Remplir les variables dans `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Lancer l'application**
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 📁 Structure du Projet

```
loft-algeria/
├── app/                    # Pages et routes Next.js
│   ├── actions/           # Server actions
│   ├── api/               # API routes
│   ├── lofts/             # Pages des lofts
│   ├── dashboard/         # Tableau de bord
│   └── ...
├── components/            # Composants React réutilisables
│   ├── ui/               # Composants UI de base
│   ├── forms/            # Formulaires
│   └── lofts/            # Composants spécifiques aux lofts
├── lib/                  # Utilitaires et configurations
│   ├── i18n/             # Configuration i18next
│   └── types.ts          # Types TypeScript
├── public/               # Assets statiques
│   └── locales/          # Fichiers de traduction
├── utils/                # Utilitaires Supabase
└── scripts/              # Scripts de maintenance
```

## 🌍 Internationalisation

Le projet supporte 3 langues :
- 🇫🇷 Français (par défaut)
- 🇬🇧 English
- 🇸🇦 العربية (Arabic)

### Ajouter une traduction
1. Ajouter la clé dans `public/locales/{lang}/{namespace}.json`
2. Utiliser dans le composant : `t('key', { ns: 'namespace' })`

## 🔧 Outils de Développement

### Scripts de Diagnostic
```bash
# Vérifier les traductions des lofts
node verify-lofts-component.cjs

# Tester toutes les traductions
node test-lofts-translations-fix.cjs

# Créer une sauvegarde des traductions
node backup-working-translations.cjs backup
```

### Scripts Disponibles
```bash
npm run dev          # Développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Linting
npm run type-check   # Vérification TypeScript
```

## 🐛 Résolution des Problèmes

### Problèmes de Traduction
Si vous rencontrez des erreurs de traduction :
1. Consultez `GUIDE_RAPIDE_TRADUCTIONS.md`
2. Lancez `node verify-lofts-component.cjs`
3. Suivez la méthodologie documentée

### Problèmes de Base de Données
- Vérifiez la connexion Supabase
- Consultez les logs dans le dashboard Supabase
- Vérifiez les politiques RLS

## 📚 Documentation

- [Guide de Résolution des Traductions](./GUIDE_RAPIDE_TRADUCTIONS.md)
- [Commandes Rapides](./COMMANDES_RAPIDES_KIRO.md)
- [Résolution Complète des Lofts](./RESOLUTION_COMPLETE_LOFTS.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

Développé avec ❤️ pour la gestion immobilière moderne.

## 🆘 Support

Pour toute question ou problème :
1. Consultez la documentation
2. Ouvrez une issue sur GitHub
3. Utilisez les outils de diagnostic fournis

---

**Note :** Ce projet inclut des outils de diagnostic et de sauvegarde pour maintenir la stabilité des traductions et éviter les régressions.