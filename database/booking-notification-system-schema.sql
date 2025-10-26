-- =====================================================
-- BOOKING NOTIFICATION SYSTEM SCHEMA
-- =====================================================
-- This script extends the existing notification system for the multi-role booking system
-- It adds support for booking-related notifications, messaging, and email templates

-- =====================================================
-- SECTION 1: EXTEND NOTIFICATIONS TABLE
-- =====================================================

-- Add booking-specific columns to existing notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notification_category TEXT DEFAULT 'general' CHECK (notification_category IN ('general', 'booking', 'payment', 'message', 'system'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- =====================================================
-- SECTION 2: BOOKING MESSAGES TABLE
-- =====================================================

-- Create booking messages table for client-partner communication
CREATE TABLE IF NOT EXISTS booking_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'attachment')),
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_size INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 3: NOTIFICATION PREFERENCES TABLE
-- =====================================================

-- Create notification preferences table for user customization
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    booking_confirmations BOOLEAN DEFAULT TRUE,
    booking_reminders BOOLEAN DEFAULT TRUE,
    payment_notifications BOOLEAN DEFAULT TRUE,
    message_notifications BOOLEAN DEFAULT TRUE,
    marketing_notifications BOOLEAN DEFAULT FALSE,
    system_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 4: EMAIL TEMPLATES TABLE
-- =====================================================

-- Create email templates table for booking notifications
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT NOT NULL UNIQUE,
    template_name TEXT NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    template_type TEXT DEFAULT 'booking' CHECK (template_type IN ('booking', 'payment', 'reminder', 'system')),
    variables JSONB DEFAULT '[]', -- Array of variable names used in template
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 5: NOTIFICATION HISTORY TABLE
-- =====================================================

-- Create notification history table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('in_app', 'email', 'sms', 'push')),
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    delivery_attempt INTEGER DEFAULT 1,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 6: INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(notification_category);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_sender_recipient ON booking_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_unread ON booking_messages(recipient_id, is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notification_history_user_delivery ON notification_history(user_id, delivery_method, delivery_status);

-- =====================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_messages
CREATE POLICY "Users can view their own booking messages" ON booking_messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can insert messages for their bookings" ON booking_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE id = booking_id 
            AND (client_id = auth.uid() OR partner_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON booking_messages
    FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for email_templates (admin only)
CREATE POLICY "Only admins can manage email templates" ON email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- RLS Policies for notification_history
CREATE POLICY "Users can view their own notification history" ON notification_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notification history" ON notification_history
    FOR INSERT WITH CHECK (true); -- Allow system to insert

-- =====================================================
-- SECTION 8: DEFAULT EMAIL TEMPLATES
-- =====================================================

-- Insert default email templates for booking system
INSERT INTO email_templates (template_key, template_name, subject_template, body_template, template_type, variables) VALUES
(
    'booking_confirmation_client',
    'Booking Confirmation - Client',
    'Booking Confirmed: {{loft_name}}',
    'Dear {{client_name}},

Your booking has been confirmed!

Booking Details:
- Property: {{loft_name}}
- Address: {{loft_address}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Guests: {{guest_count}}
- Total Amount: {{total_price}} {{currency}}
- Booking Reference: {{booking_reference}}

Your host {{partner_name}} will contact you soon with check-in instructions.

Thank you for choosing our platform!

Best regards,
The Loft Algeria Team',
    'booking',
    '["client_name", "loft_name", "loft_address", "check_in_date", "check_out_date", "guest_count", "total_price", "currency", "booking_reference", "partner_name"]'::jsonb
),
(
    'booking_confirmation_partner',
    'New Booking Received - Partner',
    'New Booking: {{loft_name}} - {{check_in_date}}',
    'Dear {{partner_name}},

You have received a new booking!

Booking Details:
- Property: {{loft_name}}
- Guest: {{client_name}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Guests: {{guest_count}}
- Total Amount: {{total_price}} {{currency}}
- Booking Reference: {{booking_reference}}

Please prepare your property and contact the guest if needed.

Manage this booking: {{booking_link}}

Best regards,
The Loft Algeria Team',
    'booking',
    '["partner_name", "loft_name", "client_name", "check_in_date", "check_out_date", "guest_count", "total_price", "currency", "booking_reference", "booking_link"]'::jsonb
),
(
    'booking_reminder_client',
    'Check-in Reminder',
    'Your stay at {{loft_name}} is tomorrow!',
    'Dear {{client_name}},

This is a friendly reminder that your check-in is tomorrow!

Booking Details:
- Property: {{loft_name}}
- Address: {{loft_address}}
- Check-in: {{check_in_date}} at {{check_in_time}}
- Check-out: {{check_out_date}}
- Booking Reference: {{booking_reference}}

Check-in Instructions:
{{check_in_instructions}}

Contact your host: {{partner_contact}}

Have a wonderful stay!

Best regards,
The Loft Algeria Team',
    'reminder',
    '["client_name", "loft_name", "loft_address", "check_in_date", "check_in_time", "check_out_date", "booking_reference", "check_in_instructions", "partner_contact"]'::jsonb
),
(
    'booking_cancellation_client',
    'Booking Cancellation Confirmation',
    'Booking Cancelled: {{loft_name}}',
    'Dear {{client_name}},

Your booking has been cancelled as requested.

Cancelled Booking Details:
- Property: {{loft_name}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Booking Reference: {{booking_reference}}
- Cancellation Date: {{cancellation_date}}

Refund Information:
{{refund_details}}

We hope to serve you again in the future.

Best regards,
The Loft Algeria Team',
    'booking',
    '["client_name", "loft_name", "check_in_date", "check_out_date", "booking_reference", "cancellation_date", "refund_details"]'::jsonb
),
(
    'booking_cancellation_partner',
    'Booking Cancellation Notice - Partner',
    'Booking Cancelled: {{loft_name}} - {{check_in_date}}',
    'Dear {{partner_name}},

A booking for your property has been cancelled.

Cancelled Booking Details:
- Property: {{loft_name}}
- Guest: {{client_name}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Booking Reference: {{booking_reference}}
- Cancellation Date: {{cancellation_date}}
- Reason: {{cancellation_reason}}

Your property is now available for these dates.

Best regards,
The Loft Algeria Team',
    'booking',
    '["partner_name", "loft_name", "client_name", "check_in_date", "check_out_date", "booking_reference", "cancellation_date", "cancellation_reason"]'::jsonb
);

-- =====================================================
-- SECTION 9: FUNCTIONS FOR NOTIFICATION SYSTEM
-- =====================================================

-- Function to create booking notification
CREATE OR REPLACE FUNCTION create_booking_notification(
    p_user_id UUID,
    p_booking_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_notification_type TEXT DEFAULT 'info',
    p_category TEXT DEFAULT 'booking',
    p_priority TEXT DEFAULT 'normal',
    p_link TEXT DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, booking_id, title, message, type, notification_category, 
        priority, link, sender_id, metadata
    ) VALUES (
        p_user_id, p_booking_id, p_title, p_message, p_notification_type, 
        p_category, p_priority, p_link, p_sender_id, p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send booking message
CREATE OR REPLACE FUNCTION send_booking_message(
    p_booking_id UUID,
    p_sender_id UUID,
    p_recipient_id UUID,
    p_message TEXT,
    p_message_type TEXT DEFAULT 'text',
    p_attachment_url TEXT DEFAULT NULL,
    p_attachment_name TEXT DEFAULT NULL,
    p_attachment_size INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
    notification_id UUID;
BEGIN
    -- Insert the message
    INSERT INTO booking_messages (
        booking_id, sender_id, recipient_id, message, message_type,
        attachment_url, attachment_name, attachment_size
    ) VALUES (
        p_booking_id, p_sender_id, p_recipient_id, p_message, p_message_type,
        p_attachment_url, p_attachment_name, p_attachment_size
    ) RETURNING id INTO message_id;
    
    -- Create notification for recipient
    SELECT create_booking_notification(
        p_recipient_id,
        p_booking_id,
        'New Message',
        CASE 
            WHEN p_message_type = 'attachment' THEN 'You received a file: ' || COALESCE(p_attachment_name, 'attachment')
            ELSE LEFT(p_message, 100) || CASE WHEN LENGTH(p_message) > 100 THEN '...' ELSE '' END
        END,
        'info',
        'message',
        'normal',
        '/bookings/' || p_booking_id::text || '/messages',
        p_sender_id,
        jsonb_build_object('message_id', message_id, 'message_type', p_message_type)
    ) INTO notification_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS notification_preferences AS $$
DECLARE
    prefs notification_preferences;
BEGIN
    SELECT * INTO prefs FROM notification_preferences WHERE user_id = p_user_id;
    
    -- If no preferences exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO notification_preferences (user_id) VALUES (p_user_id)
        RETURNING * INTO prefs;
    END IF;
    
    RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 10: TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to new tables
CREATE TRIGGER update_booking_messages_updated_at
    BEFORE UPDATE ON booking_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 11: GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions for the notification system
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;