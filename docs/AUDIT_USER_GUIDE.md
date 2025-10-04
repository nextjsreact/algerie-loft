# Guide Utilisateur - Historique d'Audit

## Introduction

Ce guide vous explique comment consulter et comprendre l'historique d'audit des transactions, tâches, réservations et lofts dans l'application Loft Algérie.

## Qu'est-ce que l'historique d'audit ?

L'historique d'audit est un journal automatique qui enregistre :
- **Qui** a effectué une action
- **Quand** l'action a été effectuée  
- **Quelle** action a été effectuée (création, modification, suppression)
- **Quels** changements ont été apportés

Cet historique vous permet de suivre l'évolution des données dans le temps et de comprendre qui a fait quoi.

## Comment accéder à l'historique d'audit

### Étape 1 : Naviguer vers une entité

1. Accédez à la page de détail d'une :
   - **Transaction** : Menu Finances → Transactions → Cliquer sur une transaction
   - **Tâche** : Menu Tâches → Cliquer sur une tâche
   - **Réservation** : Menu Réservations → Cliquer sur une réservation
   - **Loft** : Menu Lofts → Cliquer sur un loft

### Étape 2 : Ouvrir l'onglet Historique d'audit

2. Sur la page de détail, cherchez l'onglet **"Historique d'audit"**
3. Cliquez sur cet onglet pour voir l'historique

> **Note** : Si vous ne voyez pas cet onglet, cela signifie que vous n'avez pas les permissions nécessaires pour consulter l'historique d'audit.

## Comprendre l'affichage de l'historique

### Format d'une entrée d'audit

Chaque action dans l'historique est présentée sous cette forme :

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 15 mars 2024, 14:30:25 | 👤 Jean Dupont | ✏️ MODIFICATION │
├─────────────────────────────────────────────────────────────┤
│ Champs modifiés : montant, statut                          │
│                                                             │
│ Anciennes valeurs :                                         │
│ • montant: 1 500,00 €                                      │
│ • statut: En attente                                       │
│                                                             │
│ Nouvelles valeurs :                                         │
│ • montant: 1 750,00 €                                      │
│ • statut: Confirmé                                         │
└─────────────────────────────────────────────────────────────┘
```

### Éléments d'information

#### 1. En-tête de l'entrée
- **📅 Date et heure** : Moment exact de l'action
- **👤 Utilisateur** : Nom de la personne qui a effectué l'action
- **Action** : Type d'opération effectuée

#### 2. Types d'actions

| Icône | Action | Description |
|-------|--------|-------------|
| 🆕 | **CRÉATION** | Une nouvelle entité a été créée |
| ✏️ | **MODIFICATION** | Une entité existante a été modifiée |
| 🗑️ | **SUPPRESSION** | Une entité a été supprimée |

#### 3. Détails des changements

**Pour les créations** :
- Affiche toutes les valeurs initiales de l'entité créée

**Pour les modifications** :
- Liste des champs qui ont été modifiés
- Anciennes valeurs (avant la modification)
- Nouvelles valeurs (après la modification)

**Pour les suppressions** :
- Affiche toutes les valeurs de l'entité avant sa suppression

## Exemples pratiques

### Exemple 1 : Création d'une transaction

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 10 mars 2024, 09:15:42 | 👤 Marie Martin | 🆕 CRÉATION   │
├─────────────────────────────────────────────────────────────┤
│ Nouvelle transaction créée                                  │
│                                                             │
│ Valeurs initiales :                                         │
│ • montant: 2 500,00 €                                      │
│ • type: Loyer                                              │
│ • description: Loyer mars 2024 - Loft Alger Centre        │
│ • date: 10/03/2024                                         │
│ • statut: En attente                                       │
│ • loft: Loft Alger Centre                                  │
└─────────────────────────────────────────────────────────────┘
```

### Exemple 2 : Modification d'une tâche

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 12 mars 2024, 16:45:12 | 👤 Ahmed Benali | ✏️ MODIFICATION │
├─────────────────────────────────────────────────────────────┤
│ Champs modifiés : statut, assigné_à                       │
│                                                             │
│ Anciennes valeurs :                                         │
│ • statut: En cours                                         │
│ • assigné_à: Jean Dupont                                   │
│                                                             │
│ Nouvelles valeurs :                                         │
│ • statut: Terminé                                          │
│ • assigné_à: Ahmed Benali                                  │
└─────────────────────────────────────────────────────────────┘
```

### Exemple 3 : Suppression d'une réservation

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 14 mars 2024, 11:20:33 | 👤 Sarah Amara | 🗑️ SUPPRESSION │
├─────────────────────────────────────────────────────────────┤
│ Réservation supprimée                                       │
│                                                             │
│ Valeurs avant suppression :                                 │
│ • client: Karim Benaissa                                   │
│ • loft: Loft Oran Marina                                   │
│ • date_début: 20/03/2024                                   │
│ • date_fin: 25/03/2024                                     │
│ • montant: 1 200,00 €                                      │
│ • statut: Annulé                                           │
└─────────────────────────────────────────────────────────────┘
```

## Navigation dans l'historique

### Ordre chronologique

- L'historique est affiché du **plus récent au plus ancien**
- La première entrée est toujours la plus récente action
- Faites défiler vers le bas pour voir les actions plus anciennes

### Pagination

Si l'historique contient beaucoup d'entrées :
- Les entrées sont regroupées par pages
- Utilisez les boutons "Précédent" et "Suivant" en bas de la liste
- Le nombre total d'entrées est affiché

## Permissions et visibilité

### Qui peut voir quoi ?

Votre niveau d'accès détermine ce que vous pouvez voir :

#### Membres et Exécutifs
- ✅ Vos propres actions sur toutes les entités
- ❌ Actions des autres utilisateurs

#### Managers et Administrateurs  
- ✅ Toutes les actions de tous les utilisateurs
- ✅ Historique complet de toutes les entités

### Cas où l'onglet n'est pas visible

L'onglet "Historique d'audit" peut ne pas apparaître si :
- Vous n'avez pas les permissions d'audit
- Votre rôle ne permet pas de consulter l'historique
- Il n'y a aucune action enregistrée pour cette entité

## Conseils d'utilisation

### 1. Vérifier les modifications récentes

Pour voir les derniers changements sur une entité :
1. Ouvrez l'onglet Historique d'audit
2. Regardez les premières entrées (les plus récentes)
3. Identifiez qui a fait quoi et quand

### 2. Comprendre l'évolution d'une entité

Pour suivre l'évolution complète :
1. Faites défiler jusqu'en bas de l'historique
2. Remontez chronologiquement
3. Observez comment les valeurs ont changé au fil du temps

### 3. Identifier les responsables

Pour savoir qui a effectué une action spécifique :
1. Cherchez l'action dans l'historique
2. Regardez le nom d'utilisateur dans l'en-tête
3. Notez la date et l'heure pour le contexte

### 4. Analyser les changements importants

Pour les modifications importantes :
1. Comparez les anciennes et nouvelles valeurs
2. Vérifiez si tous les champs modifiés sont cohérents
3. Contactez l'utilisateur responsable si nécessaire

## Questions fréquentes

### Q : Pourquoi je ne vois pas l'onglet Historique d'audit ?

**R :** Cela peut être dû à :
- Permissions insuffisantes (contactez votre administrateur)
- Rôle utilisateur qui ne permet pas l'accès à l'audit
- Problème technique (contactez le support)

### Q : Puis-je modifier ou supprimer une entrée d'audit ?

**R :** Non, l'historique d'audit est en lecture seule. Il ne peut pas être modifié ou supprimé par les utilisateurs pour garantir l'intégrité des données.

### Q : Combien de temps l'historique est-il conservé ?

**R :** La durée de conservation dépend du type d'entité :
- Transactions : 7 ans
- Réservations : 3 ans  
- Tâches : 2 ans
- Lofts : 5 ans

### Q : Que signifie "Champs modifiés" ?

**R :** C'est la liste des propriétés de l'entité qui ont été changées lors de cette modification. Seuls les champs réellement modifiés sont listés.

### Q : Puis-je exporter l'historique d'audit ?

**R :** L'export est disponible pour les Exécutifs, Managers et Administrateurs via le dashboard d'administration d'audit.

## Cas d'usage courants

### 1. Vérification d'une transaction

**Situation** : Un client conteste le montant d'une transaction

**Action** :
1. Accédez à la transaction concernée
2. Consultez l'historique d'audit
3. Vérifiez qui a créé/modifié la transaction
4. Examinez les valeurs originales et les modifications

### 2. Suivi d'une tâche

**Situation** : Une tâche semble bloquée

**Action** :
1. Ouvrez la tâche en question
2. Consultez l'historique pour voir les changements de statut
3. Identifiez qui a travaillé sur la tâche
4. Contactez les personnes impliquées si nécessaire

### 3. Analyse d'une réservation annulée

**Situation** : Comprendre pourquoi une réservation a été annulée

**Action** :
1. Accédez à la réservation
2. Regardez l'historique pour voir les changements de statut
3. Identifiez qui a effectué l'annulation et quand
4. Vérifiez s'il y a eu des modifications avant l'annulation

## Support

Si vous rencontrez des problèmes avec l'historique d'audit :

1. **Vérifiez vos permissions** avec votre manager
2. **Contactez le support technique** si l'onglet ne s'affiche pas
3. **Signalez les incohérences** dans l'historique à l'équipe IT

---

*Ce guide fait partie de la documentation utilisateur de Loft Algérie. Pour des questions spécifiques, contactez votre administrateur système.*