-- Add type and related_id columns to notifications table for better categorization

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type VARCHAR(50),
ADD COLUMN IF NOT EXISTS related_id UUID;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_related_id ON notifications(related_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Add comment for documentation
COMMENT ON COLUMN notifications.type IS 'Type of notification (e.g., partner_registration, booking_update, etc.)';
COMMENT ON COLUMN notifications.related_id IS 'ID of the related entity (e.g., partner_id, booking_id, etc.)';
