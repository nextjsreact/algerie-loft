# 🚀 Guide Rapide : Corriger les Paiements Airbnb MAINTENANT

## 📋 Situation Actuelle

**Problèmes visibles** :
1. ❌ Payé à 0 DA pour certaines réservations Airbnb (Liria)
2. ❌ Différence 0,1 DA (Adrian : 24 632,1 DA vs 24 632 DA)

**Causes** :
1. Pas de `payment_status = 'paid'` + pas d'enregistrements dans `reservation_payments`
2. Paiements existants créés avec arrondi à l'entier (code déjà corrigé pour le futur)

---

## ✅ Solution en 3 Étapes (5 minutes)

### Étape 1 : Corriger payment_status + Créer paiements manquants

**Fichier** : `fix-airbnb-create-payments.sql`

```sql
-- 1. Voir combien de réservations sans paiements
SELECT ... (ÉTAPE 1 du fichier)

-- 2. Décommenter et exécuter ÉTAPE 2 (UPDATE payment_status)

-- 3. Décommenter et exécuter ÉTAPE 3 (INSERT INTO reservation_payments)

-- 4. Vérifier avec ÉTAPE 4
```

**Résultat** : Liria Dabbache passera de "Payé : 0 DA" à "Payé : 14 828,4 DA" ✅

---

### Étape 2 : Corriger arrondis des paiements existants

**Fichier** : `fix-existing-payment-rounding.sql`

```sql
-- 1. Identifier les paiements avec arrondis incorrects
SELECT ... (ÉTAPE 1)

-- 2. Décommenter et exécuter ÉTAPE 2 (UPDATE montants)

-- 3. Vérifier avec ÉTAPE 3
```

**Résultat** : Adrian Patterson passera de "Reste : 0,1 DA" à "Reste : 0 DA" ✅

---

### Étape 3 : Redémarrer le serveur

```bash
# Arrêter (Ctrl+C)
npm run dev
```

---

## 🎯 Résultat Final Attendu

### Liria Dabbache
```
Avant : Payé : 0 DA ❌
Après : Payé : 14 828,4 DA ✅
```

### Adrian Patterson
```
Avant : Payé : 24 632 DA, Reste : 0,1 DA ❌
Après : Payé : 24 632,1 DA, Reste : 0 DA ✅
```

---

## 📝 Checklist Rapide

- [ ] Exécuter `fix-airbnb-create-payments.sql` (ÉTAPES 1-4)
- [ ] Exécuter `fix-existing-payment-rounding.sql` (ÉTAPES 1-3)
- [ ] Redémarrer serveur Next.js
- [ ] Tester Liria Dabbache
- [ ] Tester Adrian Patterson

---

## 🆘 Si Problème Persiste

### Le montant ne change pas après les scripts

**Cause** : Cache du navigateur ou serveur pas redémarré

**Solution** :
1. Vider cache navigateur : Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)
2. Vérifier en base que les données sont bien là :
```sql
SELECT * FROM reservation_payments WHERE reservation_id = '<id>';
```
3. Redémarrer le serveur Next.js

### Les scripts SQL ne trouvent rien

**Cause** : Peut-être déjà corrigé ou aucune réservation concernée

**Solution** : Vérifier manuellement avec :
```sql
SELECT * FROM reservations 
WHERE guest_name LIKE '%Liria%' OR guest_name LIKE '%Adrian%';
```

---

**Temps total estimé** : 5 minutes  
**Difficulté** : Facile (copier-coller SQL + redémarrage)
