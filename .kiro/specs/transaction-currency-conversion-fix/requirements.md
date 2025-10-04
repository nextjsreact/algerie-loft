# Requirements Document

## Introduction

Le système de transactions présente actuellement des problèmes critiques avec la gestion des devises et les conversions. Les montants saisis dans une devise étrangère (ex: CAD) s'affichent incorrectement avec le symbole de la devise par défaut (DA) sans conversion appropriée, ce qui fausse les calculs et l'affichage des totaux. Cette fonctionnalité doit être corrigée pour assurer l'exactitude des données financières et une expérience utilisateur cohérente.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur saisissant une transaction dans une devise étrangère, je veux que le montant soit correctement converti et affiché dans la devise par défaut, afin d'avoir une vision précise de mes finances.

#### Acceptance Criteria

1. WHEN une transaction est créée avec une devise différente de la devise par défaut THEN le système SHALL calculer automatiquement le montant équivalent dans la devise par défaut
2. WHEN une transaction est créée THEN le système SHALL enregistrer le taux de change utilisé au moment de la transaction
3. WHEN une transaction est affichée THEN le système SHALL montrer à la fois le montant original dans sa devise ET le montant converti dans la devise par défaut
4. IF le taux de change n'est pas disponible THEN le système SHALL utiliser un taux par défaut de 1:1 et afficher un avertissement

### Requirement 2

**User Story:** En tant qu'utilisateur consultant la liste des transactions, je veux voir les montants correctement affichés avec les bonnes devises et conversions, afin de comprendre précisément mes flux financiers.

#### Acceptance Criteria

1. WHEN j'affiche la liste des transactions THEN chaque transaction SHALL afficher le montant dans sa devise originale avec le bon symbole
2. WHEN une transaction utilise une devise différente de la devise par défaut THEN le système SHALL afficher également le montant équivalent dans la devise par défaut
3. WHEN je consulte les totaux (revenus, dépenses, net) THEN tous les calculs SHALL être basés sur les montants convertis dans la devise par défaut
4. WHEN une transaction a été créée dans une devise étrangère THEN l'affichage SHALL clairement distinguer le montant original du montant converti

### Requirement 3

**User Story:** En tant qu'administrateur système, je veux que les calculs de totaux soient basés sur les montants convertis dans la devise par défaut, afin d'avoir des rapports financiers précis et cohérents.

#### Acceptance Criteria

1. WHEN le système calcule les totaux de revenus THEN il SHALL utiliser les montants convertis dans la devise par défaut
2. WHEN le système calcule les totaux de dépenses THEN il SHALL utiliser les montants convertis dans la devise par défaut
3. WHEN le système calcule le revenu net THEN il SHALL utiliser les montants convertis dans la devise par défaut
4. WHEN une transaction est modifiée THEN le système SHALL recalculer la conversion avec le taux de change actuel si nécessaire

### Requirement 4

**User Story:** En tant qu'utilisateur modifiant une transaction existante, je veux que les conversions de devises soient mises à jour correctement, afin de maintenir la cohérence des données financières.

#### Acceptance Criteria

1. WHEN je modifie le montant d'une transaction THEN le système SHALL recalculer automatiquement le montant équivalent dans la devise par défaut
2. WHEN je change la devise d'une transaction THEN le système SHALL recalculer la conversion avec le nouveau taux de change
3. WHEN je sauvegarde une transaction modifiée THEN le système SHALL enregistrer le nouveau taux de change utilisé
4. WHEN une transaction est modifiée THEN l'historique des modifications SHALL inclure les changements de conversion

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux avoir une interface claire pour comprendre les conversions de devises, afin de pouvoir vérifier l'exactitude des calculs.

#### Acceptance Criteria

1. WHEN je crée une transaction dans une devise étrangère THEN l'interface SHALL afficher en temps réel la conversion dans la devise par défaut
2. WHEN j'affiche une transaction THEN le système SHALL montrer le taux de change utilisé lors de la création
3. WHEN plusieurs devises sont utilisées THEN l'interface SHALL clairement distinguer chaque devise avec son symbole approprié
4. WHEN les taux de change ne sont pas disponibles THEN le système SHALL afficher un message d'avertissement approprié