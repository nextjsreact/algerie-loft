# 🌐 Guide de Traduction - Configuration Système

## 📋 Problème Identifié

La page **Configuration Système** affiche :
- ✅ Les labels de l'interface en arabe (grâce aux fichiers de traduction)
- ❌ Les descriptions des configurations en anglais (stockées dans la base de données)

### Exemple du problème :
```
الفئة: archive
boolean: auto_archive_enabled
Enable automatic data archiving  ← ❌ En anglais
القيمة الحالية: false
```

## 🔧 Solution en 3 Étapes

### Étape 1 : Vérifier la table `system_configurations`

Exécute ce script pour voir l'état actuel :
```bash
psql -d votre_base -f check-system-configurations-table.sql
```

Ou via Supabase SQL Editor :
```sql
SELECT category, config_key, description 
FROM system_configurations 
ORDER BY category, config_key;
```

### Étape 2 : Mettre à jour les descriptions en arabe

Exécute le script de correction :
```bash
psql -d votre_base -f fix-system-config-arabic-descriptions.sql
```

Ou copie-colle dans Supabase SQL Editor le contenu de `fix-system-config-arabic-descriptions.sql`

### Étape 3 : Vérifier le résultat

Recharge la page de Configuration Système. Tu devrais maintenant voir :
```
الفئة: archive
boolean: auto_archive_enabled
تفعيل الأرشفة التلقائية للبيانات  ← ✅ En arabe
القيمة الحالية: false
```

## 📝 Traductions Appliquées

### Archive (الأرشيف)
| Clé | Description EN | Description AR |
|-----|---------------|----------------|
| `auto_archive_enabled` | Enable automatic data archiving | تفعيل الأرشفة التلقائية للبيانات |
| `default_archive_after_days` | Default number of days before archiving data | عدد الأيام الافتراضي قبل أرشفة البيانات |

### Backup (النسخ الاحتياطية)
| Clé | Description EN | Description AR |
|-----|---------------|----------------|
| `auto_backup_enabled` | Enable automatic daily backups | تفعيل النسخ الاحتياطية اليومية التلقائية |
| `backup_compression_enabled` | Enable backup compression | تفعيل ضغط ملفات النسخ الاحتياطية |
| `backup_retention_days` | Number of days to retain backup files | عدد الأيام للاحتفاظ بملفات النسخ الاحتياطية |

### Maintenance (الصيانة)
| Clé | Description EN | Description AR |
|-----|---------------|----------------|
| `maintenance_window_duration_hours` | Duration of maintenance window in hours | مدة نافذة الصيانة بالساعات |
| `maintenance_window_start` | Daily maintenance window start time (24h format) | وقت بدء نافذة الصيانة اليومية (صيغة 24 ساعة) |

### Security (الأمان)
| Clé | Description EN | Description AR |
|-----|---------------|----------------|
| `account_lockout_duration_minutes` | Duration of account lockout in minutes | مدة قفل الحساب بالدقائق |
| `max_failed_login_attempts` | Maximum failed login attempts before account lockout | الحد الأقصى لمحاولات تسجيل الدخول الفاشلة قبل قفل الحساب |
| `require_2fa_for_superusers` | Require two-factor authentication for superuser accounts | طلب المصادقة الثنائية لحسابات المدير الأعلى |
| `session_timeout_minutes` | Default session timeout for regular users | مهلة الجلسة الافتراضية للمستخدمين العاديين (بالدقائق) |
| `superuser_session_timeout_minutes` | Session timeout for superuser accounts | مهلة الجلسة لحسابات المدير الأعلى (بالدقائق) |

## 🎯 Résultat Attendu

Après l'application du script, la page devrait afficher :

```
تكوين النظام
إدارة إعدادات النظام والتكوينات العامة

الفئة: archive
boolean: auto_archive_enabled
تفعيل الأرشفة التلقائية للبيانات
القيمة الحالية: false
تم التعديل بواسطة system في 04/11/2025 20:25:05

الفئة: backup
boolean: auto_backup_enabled
تفعيل النسخ الاحتياطية اليومية التلقائية
القيمة الحالية: true
تم التعديل بواسطة system في 04/11/2025 20:25:05
```

## 🔄 Pour Ajouter de Nouvelles Configurations

Quand tu ajoutes une nouvelle configuration, pense à :

1. **Ajouter la traduction dans `messages/ar.json`** (pour l'interface)
2. **Insérer avec une description en arabe** dans la base de données :

```sql
INSERT INTO system_configurations (
  category,
  config_key,
  config_value,
  data_type,
  description,  -- ← En arabe !
  is_sensitive,
  requires_restart
) VALUES (
  'email',
  'smtp_host',
  'smtp.example.com',
  'string',
  'عنوان خادم البريد الإلكتروني',  -- ← Description en arabe
  false,
  true
);
```

## 📚 Fichiers Créés

- ✅ `fix-system-config-arabic-descriptions.sql` - Script de correction
- ✅ `check-system-configurations-table.sql` - Script de vérification
- ✅ `messages/ar.json` - Traductions de l'interface (déjà mis à jour)
- ✅ `test-system-config-ar-translations.html` - Page de test

## 🚀 Commande Rapide

Pour tout faire d'un coup :
```bash
# 1. Vérifier
psql -d votre_base -f check-system-configurations-table.sql

# 2. Corriger
psql -d votre_base -f fix-system-config-arabic-descriptions.sql

# 3. Recharger la page dans le navigateur
```

## ✅ Checklist

- [x] Traductions de l'interface ajoutées dans `messages/ar.json`
- [ ] Script SQL exécuté pour mettre à jour les descriptions
- [ ] Page rechargée et vérifiée
- [ ] Toutes les descriptions s'affichent en arabe

---

**Note :** Ce problème se produit parce que les descriptions sont stockées dans la base de données, pas dans les fichiers de traduction. C'est normal pour un système de configuration dynamique !
