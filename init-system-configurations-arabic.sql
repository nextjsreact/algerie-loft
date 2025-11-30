-- Initialize System Configurations with Arabic Descriptions
-- This script creates the table and inserts default configurations with Arabic descriptions

-- Create table if not exists
CREATE TABLE IF NOT EXISTS system_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  requires_restart BOOLEAN DEFAULT false,
  modified_by TEXT,
  modified_at TIMESTAMPTZ DEFAULT NOW(),
  previous_value JSONB,
  previous_modified_at TIMESTAMPTZ,
  previous_modified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_configurations_category ON system_configurations(category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(config_key);

-- Enable RLS
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- Create policy for superusers
DROP POLICY IF EXISTS "Superusers can manage system configurations" ON system_configurations;
CREATE POLICY "Superusers can manage system configurations"
  ON system_configurations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

-- Insert default configurations with Arabic descriptions
-- Archive configurations
INSERT INTO system_configurations (category, config_key, config_value, data_type, description, is_sensitive, requires_restart, modified_by)
VALUES 
  ('archive', 'auto_archive_enabled', 'false', 'boolean', 'تفعيل الأرشفة التلقائية للبيانات', false, false, 'system'),
  ('archive', 'default_archive_after_days', '365', 'number', 'عدد الأيام الافتراضي قبل أرشفة البيانات', false, false, 'system')
ON CONFLICT (config_key) DO UPDATE SET
  description = EXCLUDED.description,
  modified_at = NOW();

-- Backup configurations
INSERT INTO system_configurations (category, config_key, config_value, data_type, description, is_sensitive, requires_restart, modified_by)
VALUES 
  ('backup', 'auto_backup_enabled', 'true', 'boolean', 'تفعيل النسخ الاحتياطية اليومية التلقائية', false, false, 'system'),
  ('backup', 'backup_compression_enabled', 'true', 'boolean', 'تفعيل ضغط ملفات النسخ الاحتياطية', false, false, 'system'),
  ('backup', 'backup_retention_days', '30', 'number', 'عدد الأيام للاحتفاظ بملفات النسخ الاحتياطية', false, false, 'system')
ON CONFLICT (config_key) DO UPDATE SET
  description = EXCLUDED.description,
  modified_at = NOW();

-- Maintenance configurations
INSERT INTO system_configurations (category, config_key, config_value, data_type, description, is_sensitive, requires_restart, modified_by)
VALUES 
  ('maintenance', 'maintenance_window_duration_hours', '2', 'number', 'مدة نافذة الصيانة بالساعات', false, true, 'system'),
  ('maintenance', 'maintenance_window_start', '"02:00"', 'string', 'وقت بدء نافذة الصيانة اليومية (صيغة 24 ساعة)', false, true, 'system')
ON CONFLICT (config_key) DO UPDATE SET
  description = EXCLUDED.description,
  modified_at = NOW();

-- Security configurations
INSERT INTO system_configurations (category, config_key, config_value, data_type, description, is_sensitive, requires_restart, modified_by)
VALUES 
  ('security', 'account_lockout_duration_minutes', '30', 'number', 'مدة قفل الحساب بالدقائق', false, false, 'system'),
  ('security', 'max_failed_login_attempts', '5', 'number', 'الحد الأقصى لمحاولات تسجيل الدخول الفاشلة قبل قفل الحساب', false, false, 'system'),
  ('security', 'require_2fa_for_superusers', 'true', 'boolean', 'طلب المصادقة الثنائية لحسابات المدير الأعلى', false, true, 'system'),
  ('security', 'session_timeout_minutes', '60', 'number', 'مهلة الجلسة الافتراضية للمستخدمين العاديين (بالدقائق)', false, true, 'system'),
  ('security', 'superuser_session_timeout_minutes', '30', 'number', 'مهلة الجلسة لحسابات المدير الأعلى (بالدقائق)', false, true, 'system')
ON CONFLICT (config_key) DO UPDATE SET
  description = EXCLUDED.description,
  modified_at = NOW();

-- Grant permissions
GRANT ALL ON system_configurations TO authenticated;

-- Verify the setup
SELECT 
  category,
  config_key,
  data_type,
  config_value,
  description,
  is_sensitive,
  requires_restart
FROM system_configurations
ORDER BY category, config_key;

-- Success message
SELECT '✅ تم إنشاء/تحديث جدول التكوينات بنجاح مع الأوصاف العربية!' as status;
