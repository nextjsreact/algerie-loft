# 🔧 Fix Traductions - Page Configuration Système

## 🎯 Problème

La page **Configuration Système** affiche les descriptions en **anglais** au lieu de l'**arabe** :

```
❌ Enable automatic data archiving
❌ Default number of days before archiving data
❌ Enable automatic daily backups
```

## ✅ Solution Rapide

### Option 1 : Si la table existe déjà

Exécute ce script dans Supabase SQL Editor :

```sql
-- Copie le contenu de : fix-system-config-arabic-descriptions.sql
```

### Option 2 : Si la table n'existe pas encore

Exécute ce script dans Supabase SQL Editor :

```sql
-- Copie le contenu de : init-system-configurations-arabic.sql
```

## 📁 Fichiers Créés

1. **check-system-configurations-table.sql** 
   - Vérifie l'état actuel de la table
   - Identifie les descriptions en anglais

2. **fix-system-config-arabic-descriptions.sql**
   - Met à jour les descriptions existantes en arabe
   - À utiliser si la table existe déjà

3. **init-system-configurations-arabic.sql**
   - Crée la table avec les descriptions en arabe
   - Insère les configurations par défaut
   - À utiliser pour une nouvelle installation

4. **GUIDE_TRADUCTION_CONFIG_SYSTEME.md**
   - Guide complet avec toutes les traductions
   - Explications détaillées

## 🚀 Étapes d'Exécution

### 1. Vérifier l'état actuel
```bash
# Ouvre Supabase SQL Editor et exécute :
SELECT config_key, description FROM system_configurations;
```

### 2. Appliquer la correction
```bash
# Si descriptions en anglais → Copie fix-system-config-arabic-descriptions.sql
# Si table n'existe pas → Copie init-system-configurations-arabic.sql
```

### 3. Vérifier le résultat
```bash
# Recharge la page Configuration Système
# Toutes les descriptions doivent être en arabe
```

## ✨ Résultat Attendu

Après correction, tu verras :

```
✅ تفعيل الأرشفة التلقائية للبيانات
✅ عدد الأيام الافتراضي قبل أرشفة البيانات
✅ تفعيل النسخ الاحتياطية اليومية التلقائية
✅ تفعيل ضغط ملفات النسخ الاحتياطية
✅ عدد الأيام للاحتفاظ بملفات النسخ الاحتياطية
✅ مدة نافذة الصيانة بالساعات
✅ وقت بدء نافذة الصيانة اليومية
✅ مدة قفل الحساب بالدقائق
✅ الحد الأقصى لمحاولات تسجيل الدخول الفاشلة
✅ طلب المصادقة الثنائية لحسابات المدير الأعلى
✅ مهلة الجلسة الافتراضية للمستخدمين العاديين
✅ مهلة الجلسة لحسابات المدير الأعلى
```

## 📝 Note Importante

Les **descriptions** sont stockées dans la **base de données**, pas dans les fichiers de traduction JSON. C'est pourquoi il faut exécuter un script SQL pour les mettre à jour.

Les **labels de l'interface** (titre, boutons, etc.) sont dans `messages/ar.json` et ont déjà été corrigés ✅

---

**Temps estimé :** 2 minutes ⏱️
