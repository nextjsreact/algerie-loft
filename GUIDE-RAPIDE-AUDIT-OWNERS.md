# 🚀 Guide Rapide: Activer l'Audit des Propriétaires

## ❌ Problème Actuel
Les modifications des propriétaires (créer, modifier, supprimer) ne sont **PAS enregistrées** dans les logs d'audit.

## ✅ Solution en 3 Étapes

### Étape 1: Ouvrir Supabase SQL Editor
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet "Loft Algérie"
3. Cliquez sur "SQL Editor" dans le menu de gauche

### Étape 2: Exécuter le Script SQL
1. Cliquez sur "New query"
2. Copiez et collez ce code:

```sql
DROP TRIGGER IF EXISTS audit_trigger_owners ON owners;

CREATE TRIGGER audit_trigger_owners
    AFTER INSERT OR UPDATE OR DELETE ON owners
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();
```

3. Cliquez sur "Run" (ou appuyez sur Ctrl+Enter)
4. Vous devriez voir un message de succès

### Étape 3: Tester
1. Allez sur https://www.loftalgerie.com/owners
2. Cliquez sur "Modifier" pour un propriétaire
3. Changez le nom ou le téléphone
4. Cliquez sur "Enregistrer"
5. Allez sur https://www.loftalgerie.com/settings/audit
6. Dans "Nom de table", sélectionnez "Propriétaire"
7. Vous devriez voir votre modification! 🎉

## 📋 Ce Qui Sera Enregistré

Pour chaque modification d'un propriétaire, le système enregistrera:
- ✅ Qui a fait la modification (nom et email)
- ✅ Quand (date et heure exacte)
- ✅ Quelle action (Créé / Modifié / Supprimé)
- ✅ Anciennes valeurs (avant modification)
- ✅ Nouvelles valeurs (après modification)
- ✅ Adresse IP et navigateur utilisé

## 🔍 Comment Consulter les Logs

1. Allez sur `/settings/audit`
2. Utilisez les filtres:
   - **Table**: Sélectionnez "Propriétaire"
   - **Action**: Créé / Modifié / Supprimé
   - **Utilisateur**: Filtrer par utilisateur spécifique
   - **Date**: Sélectionner une période
3. Cliquez sur une ligne pour voir les détails complets
4. Exportez en CSV si nécessaire

## 📁 Fichiers Modifiés (Déjà Fait)

Le code a déjà été mis à jour dans:
- ✅ Types TypeScript
- ✅ API Routes (4 fichiers)
- ✅ Composants UI (2 fichiers)
- ✅ Traductions (FR, EN, AR)
- ✅ Tests

**Il ne reste plus qu'à exécuter le script SQL dans Supabase!**

## ❓ Questions Fréquentes

**Q: Est-ce que ça va ralentir l'application?**
R: Non, l'impact sur les performances est négligeable.

**Q: Combien de temps les logs sont conservés?**
R: Les logs sont conservés indéfiniment (sauf configuration de rétention).

**Q: Qui peut voir les logs d'audit?**
R: Seulement les administrateurs et managers.

**Q: Peut-on supprimer ou modifier les logs?**
R: Non, les logs d'audit sont en lecture seule pour garantir l'intégrité.

**Q: Ça fonctionne pour les modifications via l'API aussi?**
R: Oui, toutes les modifications (UI, API, scripts) sont enregistrées.

## 🆘 En Cas de Problème

Si le script SQL échoue:
1. Vérifiez que la fonction `audit.audit_trigger_function()` existe
2. Vérifiez que vous avez les permissions nécessaires
3. Contactez le support Supabase si nécessaire

Si les logs n'apparaissent pas:
1. Vérifiez que le trigger est bien créé (voir script de vérification)
2. Videz le cache du navigateur (Ctrl+F5)
3. Vérifiez les permissions de votre utilisateur

## 📞 Support

Pour toute question, consultez:
- `AUDIT-OWNERS-SETUP.md` - Documentation complète
- `RESUME-AUDIT-OWNERS.md` - Résumé technique
- `scripts/enable-owners-audit.sql` - Script SQL avec vérifications
