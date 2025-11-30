-- Fix System Configuration Descriptions - Arabic Translation
-- This script updates all system configuration descriptions to Arabic

-- Archive configurations
UPDATE system_configurations 
SET description = 'تفعيل الأرشفة التلقائية للبيانات'
WHERE config_key = 'auto_archive_enabled';

UPDATE system_configurations 
SET description = 'عدد الأيام الافتراضي قبل أرشفة البيانات'
WHERE config_key = 'default_archive_after_days';

-- Backup configurations
UPDATE system_configurations 
SET description = 'تفعيل النسخ الاحتياطية اليومية التلقائية'
WHERE config_key = 'auto_backup_enabled';

UPDATE system_configurations 
SET description = 'تفعيل ضغط ملفات النسخ الاحتياطية'
WHERE config_key = 'backup_compression_enabled';

UPDATE system_configurations 
SET description = 'عدد الأيام للاحتفاظ بملفات النسخ الاحتياطية'
WHERE config_key = 'backup_retention_days';

-- Maintenance configurations
UPDATE system_configurations 
SET description = 'مدة نافذة الصيانة بالساعات'
WHERE config_key = 'maintenance_window_duration_hours';

UPDATE system_configurations 
SET description = 'وقت بدء نافذة الصيانة اليومية (صيغة 24 ساعة)'
WHERE config_key = 'maintenance_window_start';

-- Security configurations
UPDATE system_configurations 
SET description = 'مدة قفل الحساب بالدقائق'
WHERE config_key = 'account_lockout_duration_minutes';

UPDATE system_configurations 
SET description = 'الحد الأقصى لمحاولات تسجيل الدخول الفاشلة قبل قفل الحساب'
WHERE config_key = 'max_failed_login_attempts';

UPDATE system_configurations 
SET description = 'طلب المصادقة الثنائية لحسابات المدير الأعلى'
WHERE config_key = 'require_2fa_for_superusers';

UPDATE system_configurations 
SET description = 'مهلة الجلسة الافتراضية للمستخدمين العاديين (بالدقائق)'
WHERE config_key = 'session_timeout_minutes';

UPDATE system_configurations 
SET description = 'مهلة الجلسة لحسابات المدير الأعلى (بالدقائق)'
WHERE config_key = 'superuser_session_timeout_minutes';

-- Verify the updates
SELECT 
  category,
  config_key,
  description,
  data_type,
  config_value
FROM system_configurations
ORDER BY category, config_key;

-- Success message
SELECT '✅ تم تحديث جميع أوصاف التكوينات إلى اللغة العربية بنجاح!' as status;
