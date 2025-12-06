# 🏢 Différence entre Partner et Propriétaire

## 📋 Vue d'ensemble

Dans l'application Loft Algérie, il existe **deux types de propriétaires** de lofts, gérés différemment selon leur relation avec l'entreprise.

---

## 👥 Les Deux Types

### 1. **Propriétaire Interne (Owner)** 🏠
**Table:** `loft_owners` → migre vers `owners`

**Qui sont-ils?**
- Propriétaires traditionnels de l'entreprise
- Propriétaires tiers qui louent leurs biens via l'entreprise
- Contacts internes pour la gestion des lofts

**Caractéristiques:**
- ❌ **Pas de compte utilisateur** (pas de `user_id`)
- ✅ Vérification automatique (`verification_status: 'verified'`)
- 📝 Informations basiques: nom, email, téléphone, adresse
- 🏢 Type de propriété: `company` ou `third_party`

**Accès:**
- Gérés uniquement par les **admins/managers** de l'entreprise
- Ne peuvent pas se connecter à l'application
- Pas de dashboard personnel

---

### 2. **Partner (Partenaire)** 🤝
**Table:** `partner_profiles` / `partners` → migre vers `owners`

**Qui sont-ils?**
- Propriétaires externes avec compte utilisateur
- Partenaires commerciaux qui gèrent leurs propres lofts
- Peuvent être des particuliers ou des entreprises

**Caractéristiques:**
- ✅ **Compte utilisateur obligatoire** (`user_id` présent)
- 🔐 **Rôle:** `partner` dans la table `profiles`
- 📊 Accès à un **dashboard personnel**
- 🔍 Processus de vérification: `pending` → `verified` / `rejected`
- 💼 Informations business complètes:
  - `business_name` (nom de l'entreprise)
  - `business_type` (individual / company)
  - `tax_id` (numéro fiscal)
  - `bank_details` (coordonnées bancaires)
  - `verification_documents` (documents justificatifs)
  - `portfolio_description` (description du portfolio)

**Accès:**
- ✅ Se connectent à l'application
- ✅ Dashboard partenaire: `/[locale]/partner/dashboard`
- ✅ Gèrent leurs propres lofts
- ✅ Voient leurs réservations et revenus
- ✅ Peuvent modifier leurs informations

---

## 🗄️ Structure de la Base de Données

### Tables Actuelles (Avant Migration)

```
loft_owners (propriétaires internes)
├── id
├── name
├── email
├── phone
├── address
├── ownership_type (company/third_party)
└── ❌ PAS de user_id

partner_profiles (partenaires)
├── id
├── user_id ✅ (lien vers auth.users)
├── business_name
├── business_type
├── tax_id
├── phone
├── address
├── verification_status
├── verification_documents
├── bank_details
└── portfolio_description
```

### Table Unifiée (Après Migration)

```sql
owners (table unifiée)
├── id
├── user_id (NULL pour propriétaires internes, présent pour partners)
├── name
├── email
├── phone
├── address
├── business_name
├── business_type
├── ownership_type
├── tax_id
├── verification_status
├── verification_documents
├── bank_details
└── portfolio_description
```

**Distinction:**
- `user_id IS NULL` → Propriétaire interne
- `user_id IS NOT NULL` → Partner

---

## 🔐 Rôles et Permissions

### Rôles Utilisateurs
```typescript
type UserRole = 
  | 'admin'       // Accès complet
  | 'superuser'   // Accès complet + gestion système
  | 'manager'     // Gestion opérationnelle
  | 'executive'   // Vue exécutive
  | 'member'      // Employé standard
  | 'client'      // Client/locataire
  | 'partner'     // ⭐ Partenaire propriétaire
  | 'guest'       // Visiteur
```

### Permissions Partner

**Dashboard Partner** (`/[locale]/partner/dashboard`)
- ✅ Vue d'ensemble de leurs lofts
- ✅ Statistiques de réservations
- ✅ Revenus et paiements
- ✅ Gestion des disponibilités
- ✅ Messages clients
- ✅ Profil et vérification

**Isolation des Données (RLS)**
```sql
-- Partners ne voient QUE leurs propres données
CREATE POLICY "partners_own_data" ON lofts
  FOR SELECT USING (partner_id = auth.uid());
```

---

## 🔄 Flux de Travail

### Propriétaire Interne
```
1. Admin crée le propriétaire dans le système
2. Propriétaire automatiquement vérifié
3. Admin associe des lofts au propriétaire
4. Admin gère tout pour le propriétaire
```

### Partner
```
1. Partner s'inscrit via formulaire
   ↓
2. Statut: pending
   ↓
3. Admin vérifie les documents
   ↓
4. Admin approuve/rejette
   ↓
5. Si approuvé: Partner accède au dashboard
   ↓
6. Partner ajoute/gère ses lofts
   ↓
7. Partner suit ses réservations et revenus
```

---

## 💰 Gestion Financière

### Propriétaire Interne
- Pourcentages définis par l'admin
- Paiements gérés manuellement
- Pas de suivi automatique

### Partner
- Pourcentages configurables
- Suivi automatique des revenus
- Dashboard avec statistiques
- Historique des paiements
- Rapports financiers

---

## 📊 Exemple de Données

### Propriétaire Interne
```json
{
  "id": "uuid-1",
  "user_id": null,
  "name": "Société Immobilière ABC",
  "email": "contact@abc.dz",
  "phone": "+213 555 123 456",
  "ownership_type": "company",
  "verification_status": "verified"
}
```

### Partner
```json
{
  "id": "uuid-2",
  "user_id": "auth-user-uuid",
  "name": "Ahmed Benali",
  "business_name": "Benali Properties",
  "business_type": "company",
  "tax_id": "123456789",
  "email": "ahmed@benali.dz",
  "phone": "+213 555 987 654",
  "verification_status": "verified",
  "bank_details": {
    "bank_name": "CPA",
    "account_number": "***1234",
    "rib": "***"
  }
}
```

---

## 🔍 Comment Identifier le Type?

### Dans le Code
```typescript
// Vérifier si c'est un partner
const isPartner = owner.user_id !== null;

// Vérifier le rôle utilisateur
const userRole = session.user.role; // 'partner'

// Vérifier l'accès partner
if (userRole === 'partner') {
  // Accès dashboard partner
}
```

### Dans la Base de Données
```sql
-- Propriétaires internes
SELECT * FROM owners WHERE user_id IS NULL;

-- Partners
SELECT * FROM owners WHERE user_id IS NOT NULL;

-- Partners avec leur compte
SELECT o.*, p.role 
FROM owners o
JOIN profiles p ON o.user_id = p.id
WHERE p.role = 'partner';
```

---

## 🎯 Résumé Rapide

| Critère | Propriétaire Interne | Partner |
|---------|---------------------|---------|
| **Compte utilisateur** | ❌ Non | ✅ Oui |
| **user_id** | NULL | UUID |
| **Rôle** | - | `partner` |
| **Dashboard** | ❌ Non | ✅ Oui |
| **Connexion** | ❌ Non | ✅ Oui |
| **Vérification** | Auto | Manuelle |
| **Gestion** | Par admin | Autonome |
| **Infos business** | Basiques | Complètes |
| **Suivi financier** | Manuel | Automatique |

---

## 🚀 Migration en Cours

La migration unifie les deux tables (`loft_owners` + `partner_profiles`) en une seule table `owners`, tout en conservant la distinction via le champ `user_id`.

**Fichiers de migration:**
- `UNIFIED_OWNERS_MIGRATION.sql` - Script complet
- `01-create-owners-table.sql` - Création table
- `02-migrate-data-FIXED.sql` - Migration données
- `03-update-lofts-table.sql` - Mise à jour lofts
- `04-add-rls-policies.sql` - Sécurité RLS

---

## 📝 Notes Importantes

1. **Un partner est un type spécial de propriétaire** avec compte utilisateur
2. **Tous les partners sont des owners**, mais tous les owners ne sont pas des partners
3. **La distinction se fait via `user_id`** (NULL = interne, présent = partner)
4. **Le rôle `partner`** dans `profiles` donne accès au dashboard
5. **RLS garantit l'isolation** des données entre partners

---

**Créé le:** 6 décembre 2025  
**Dernière mise à jour:** 6 décembre 2025
