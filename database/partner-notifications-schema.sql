-- Partner Notifications System Schema
-- This schema supports comprehensive notification management for partners

-- Create partner notifications table
CREATE TABLE IF NOT EXISTS partner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'registration_received',
    'registration_approved', 
    'registration_rejected',
    'property_added',
    'property_updated',
    'property_removed',
    'new_reservation',
    'reservation_cancelled',
    'reservation_modified',
    'payment_received',
    'revenue_report',
    'system_maintenance',
    'account_update',
    'security_alert',
    'performance_summary'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  channels TEXT[] DEFAULT ARRAY['in_app'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Create partner notification preferences table
CREATE TABLE IF NOT EXISTS partner_notification_preferences (
  partner_id UUID PRIMARY KEY REFERENCES partners(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{
    "registration_received": {"enabled": true, "channels": ["email", "in_app"]},
    "registration_approved": {"enabled": true, "channels": ["email", "in_app"]},
    "registration_rejected": {"enabled": true, "channels": ["email", "in_app"]},
    "property_added": {"enabled": true, "channels": ["in_app"]},
    "property_updated": {"enabled": true, "channels": ["in_app"]},
    "property_removed": {"enabled": true, "channels": ["email", "in_app"]},
    "new_reservation": {"enabled": true, "channels": ["email", "in_app"]},
    "reservation_cancelled": {"enabled": true, "channels": ["email", "in_app"]},
    "reservation_modified": {"enabled": true, "channels": ["in_app"]},
    "payment_received": {"enabled": true, "channels": ["email", "in_app"]},
    "revenue_report": {"enabled": true, "channels": ["email"], "frequency": "weekly"},
    "system_maintenance": {"enabled": true, "channels": ["email", "in_app"]},
    "account_update": {"enabled": true, "channels": ["email", "in_app"]},
    "security_alert": {"enabled": true, "channels": ["email", "in_app"]},
    "performance_summary": {"enabled": true, "channels": ["email"], "frequency": "weekly"}
  }'::jsonb,
  quiet_hours JSONB DEFAULT '{
    "enabled": false,
    "start_time": "22:00",
    "end_time": "08:00",
    "timezone": "Africa/Algiers"
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_id ON partner_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_type ON partner_notifications(type);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_read ON partner_notifications(read);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_priority ON partner_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_created_at ON partner_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_expires_at ON partner_notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_unread ON partner_notifications(partner_id, read) WHERE read = FALSE;

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_type_created ON partner_notifications(partner_id, type, created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE partner_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Partners can only see their own notifications
CREATE POLICY "Partners can view own notifications" ON partner_notifications
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can update their own notifications (mark as read, delete)
CREATE POLICY "Partners can update own notifications" ON partner_notifications
  FOR UPDATE USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can delete their own notifications
CREATE POLICY "Partners can delete own notifications" ON partner_notifications
  FOR DELETE USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- System can insert notifications for any partner
CREATE POLICY "System can insert notifications" ON partner_notifications
  FOR INSERT WITH CHECK (true);

-- Partners can view and update their own preferences
CREATE POLICY "Partners can manage own preferences" ON partner_notification_preferences
  FOR ALL USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Admins have full access to notifications (for debugging/support)
CREATE POLICY "Admins have full access to notifications" ON partner_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to preferences" ON partner_notification_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to automatically create default preferences for new partners
CREATE OR REPLACE FUNCTION create_default_partner_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO partner_notification_preferences (partner_id)
  VALUES (NEW.id)
  ON CONFLICT (partner_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when a partner is created
DROP TRIGGER IF EXISTS trigger_create_default_partner_notification_preferences ON partners;
CREATE TRIGGER trigger_create_default_partner_notification_preferences
  AFTER INSERT ON partners
  FOR EACH ROW
  EXECUTE FUNCTION create_default_partner_notification_preferences();

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_partner_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM partner_notifications
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count for a partner
CREATE OR REPLACE FUNCTION get_partner_unread_notification_count(partner_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM partner_notifications
  WHERE partner_notifications.partner_id = get_partner_unread_notification_count.partner_id
    AND read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a partner
CREATE OR REPLACE FUNCTION mark_all_partner_notifications_read(partner_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE partner_notifications
  SET read = TRUE, read_at = NOW()
  WHERE partner_notifications.partner_id = mark_all_partner_notifications_read.partner_id
    AND read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get partner notifications with pagination
CREATE OR REPLACE FUNCTION get_partner_notifications(
  partner_id UUID,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0,
  unread_only BOOLEAN DEFAULT FALSE,
  notification_type TEXT DEFAULT NULL,
  priority_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  read BOOLEAN,
  priority TEXT,
  channels TEXT[],
  created_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pn.id,
    pn.type,
    pn.title,
    pn.message,
    pn.data,
    pn.read,
    pn.priority,
    pn.channels,
    pn.created_at,
    pn.read_at,
    pn.expires_at,
    COUNT(*) OVER() as total_count
  FROM partner_notifications pn
  WHERE pn.partner_id = get_partner_notifications.partner_id
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (NOT unread_only OR read = FALSE)
    AND (notification_type IS NULL OR pn.type = notification_type)
    AND (priority_filter IS NULL OR pn.priority = priority_filter)
  ORDER BY pn.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification (to be called by application)
CREATE OR REPLACE FUNCTION send_partner_notification(
  partner_id UUID,
  notification_type TEXT,
  title TEXT,
  message TEXT,
  data JSONB DEFAULT NULL,
  priority TEXT DEFAULT 'medium',
  channels TEXT[] DEFAULT ARRAY['in_app']
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  expiration_date TIMESTAMPTZ;
BEGIN
  -- Calculate expiration date based on type
  CASE notification_type
    WHEN 'registration_received' THEN expiration_date := NOW() + INTERVAL '30 days';
    WHEN 'property_added', 'property_updated' THEN expiration_date := NOW() + INTERVAL '7 days';
    WHEN 'property_removed', 'new_reservation', 'reservation_cancelled', 'reservation_modified' THEN expiration_date := NOW() + INTERVAL '30 days';
    WHEN 'payment_received', 'revenue_report', 'performance_summary' THEN expiration_date := NOW() + INTERVAL '90 days';
    WHEN 'system_maintenance' THEN expiration_date := NOW() + INTERVAL '1 day';
    WHEN 'account_update' THEN expiration_date := NOW() + INTERVAL '30 days';
    ELSE expiration_date := NULL; -- Never expires for security alerts, approvals, rejections
  END CASE;

  -- Insert notification
  INSERT INTO partner_notifications (
    partner_id,
    type,
    title,
    message,
    data,
    priority,
    channels,
    expires_at
  ) VALUES (
    partner_id,
    notification_type,
    title,
    message,
    data,
    priority,
    channels,
    expiration_date
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for notification statistics
CREATE OR REPLACE VIEW partner_notification_stats AS
SELECT 
  p.id as partner_id,
  p.user_id,
  COUNT(pn.id) as total_notifications,
  COUNT(pn.id) FILTER (WHERE pn.read = FALSE) as unread_notifications,
  COUNT(pn.id) FILTER (WHERE pn.priority = 'urgent') as urgent_notifications,
  COUNT(pn.id) FILTER (WHERE pn.priority = 'high') as high_priority_notifications,
  COUNT(pn.id) FILTER (WHERE pn.created_at >= NOW() - INTERVAL '24 hours') as notifications_last_24h,
  COUNT(pn.id) FILTER (WHERE pn.created_at >= NOW() - INTERVAL '7 days') as notifications_last_week,
  MAX(pn.created_at) as last_notification_at
FROM partners p
LEFT JOIN partner_notifications pn ON p.id = pn.partner_id 
  AND (pn.expires_at IS NULL OR pn.expires_at > NOW())
GROUP BY p.id, p.user_id;

-- Grant necessary permissions
GRANT SELECT ON partner_notification_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_partner_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_notifications(UUID, INTEGER, INTEGER, BOOLEAN, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_partner_notification(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_partner_notifications() TO service_role;

-- Create a scheduled job to clean up expired notifications (if pg_cron is available)
-- This would typically be set up separately in the database
-- SELECT cron.schedule('cleanup-expired-partner-notifications', '0 2 * * *', 'SELECT cleanup_expired_partner_notifications();');

-- Insert some sample notification preferences for testing (optional)
-- This would be handled by the application trigger in production
/*
INSERT INTO partner_notification_preferences (partner_id, email_enabled, in_app_enabled)
SELECT id, true, true
FROM partners
WHERE id NOT IN (SELECT partner_id FROM partner_notification_preferences)
ON CONFLICT (partner_id) DO NOTHING;
*/

-- Comments for documentation
COMMENT ON TABLE partner_notifications IS 'Stores all notifications sent to partners';
COMMENT ON TABLE partner_notification_preferences IS 'Stores notification preferences for each partner';
COMMENT ON FUNCTION send_partner_notification IS 'Creates a new notification for a partner with automatic expiration';
COMMENT ON FUNCTION cleanup_expired_partner_notifications IS 'Removes expired notifications to keep the table clean';
COMMENT ON FUNCTION get_partner_unread_notification_count IS 'Returns the count of unread notifications for a partner';
COMMENT ON VIEW partner_notification_stats IS 'Provides notification statistics for each partner';