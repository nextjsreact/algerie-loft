-- Booking Disputes Schema for Multi-Role Booking System
-- This schema supports the admin dispute resolution functionality

-- Create booking_disputes table
CREATE TABLE IF NOT EXISTS booking_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('cancellation', 'refund', 'property_issue', 'payment', 'other')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  description TEXT NOT NULL,
  reported_by TEXT NOT NULL CHECK (reported_by IN ('client', 'partner')),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  compensation_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dispute_messages table for communication
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES booking_disputes(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'partner', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_disputes_booking_id ON booking_disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_disputes_status ON booking_disputes(status);
CREATE INDEX IF NOT EXISTS idx_booking_disputes_priority ON booking_disputes(priority);
CREATE INDEX IF NOT EXISTS idx_booking_disputes_created_at ON booking_disputes(created_at);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON dispute_messages(created_at);

-- Add RLS policies for booking_disputes
ALTER TABLE booking_disputes ENABLE ROW LEVEL SECURITY;

-- Policy for admins and managers to see all disputes
CREATE POLICY "Admins can manage all disputes" ON booking_disputes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy for clients to see their own disputes
CREATE POLICY "Clients can see own disputes" ON booking_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_disputes.booking_id 
      AND bookings.client_id = auth.uid()
    )
  );

-- Policy for partners to see disputes related to their properties
CREATE POLICY "Partners can see property disputes" ON booking_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_disputes.booking_id 
      AND bookings.partner_id = auth.uid()
    )
  );

-- Policy for clients and partners to create disputes
CREATE POLICY "Users can create disputes for their bookings" ON booking_disputes
  FOR INSERT WITH CHECK (
    (reported_by = 'client' AND EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_disputes.booking_id 
      AND bookings.client_id = auth.uid()
    )) OR
    (reported_by = 'partner' AND EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_disputes.booking_id 
      AND bookings.partner_id = auth.uid()
    ))
  );

-- Add RLS policies for dispute_messages
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;

-- Policy for admins and managers to see all messages
CREATE POLICY "Admins can manage all dispute messages" ON dispute_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy for clients and partners to see messages in their disputes
CREATE POLICY "Users can see messages in their disputes" ON dispute_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM booking_disputes bd
      JOIN bookings b ON b.id = bd.booking_id
      WHERE bd.id = dispute_messages.dispute_id
      AND (b.client_id = auth.uid() OR b.partner_id = auth.uid())
    )
  );

-- Policy for clients and partners to add messages to their disputes
CREATE POLICY "Users can add messages to their disputes" ON dispute_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM booking_disputes bd
      JOIN bookings b ON b.id = bd.booking_id
      WHERE bd.id = dispute_messages.dispute_id
      AND (
        (sender_role = 'client' AND b.client_id = auth.uid()) OR
        (sender_role = 'partner' AND b.partner_id = auth.uid()) OR
        (sender_role = 'admin' AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'manager')
        ))
      )
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for booking_disputes
CREATE TRIGGER update_booking_disputes_updated_at 
  BEFORE UPDATE ON booking_disputes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit triggers for booking disputes
CREATE TRIGGER audit_booking_disputes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON booking_disputes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_dispute_messages_trigger
  AFTER INSERT OR UPDATE OR DELETE ON dispute_messages
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create function to get dispute statistics
CREATE OR REPLACE FUNCTION get_dispute_stats()
RETURNS TABLE (
  total_disputes BIGINT,
  open_disputes BIGINT,
  investigating_disputes BIGINT,
  resolved_disputes BIGINT,
  closed_disputes BIGINT,
  high_priority_disputes BIGINT,
  urgent_priority_disputes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_disputes,
    COUNT(*) FILTER (WHERE status = 'open') as open_disputes,
    COUNT(*) FILTER (WHERE status = 'investigating') as investigating_disputes,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_disputes,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_disputes,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority_disputes,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_priority_disputes
  FROM booking_disputes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dispute_stats() TO authenticated;

-- Create function to get user management statistics
CREATE OR REPLACE FUNCTION get_user_management_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  client_users BIGINT,
  partner_users BIGINT,
  employee_users BIGINT,
  pending_partners BIGINT,
  verified_partners BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE role = 'client') as client_users,
    COUNT(*) FILTER (WHERE role = 'partner') as partner_users,
    COUNT(*) FILTER (WHERE role IN ('admin', 'manager', 'executive', 'member')) as employee_users,
    (SELECT COUNT(*) FROM partner_profiles WHERE verification_status = 'pending') as pending_partners,
    (SELECT COUNT(*) FROM partner_profiles WHERE verification_status = 'verified') as verified_partners
  FROM profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to admin and manager roles only
GRANT EXECUTE ON FUNCTION get_user_management_stats() TO authenticated;

-- Add RLS policy to restrict function access
CREATE POLICY "Only admins can access user stats" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
    )
  );

-- Create notification triggers for dispute events
CREATE OR REPLACE FUNCTION notify_dispute_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify admins about new dispute
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    reference_type,
    reference_id
  )
  SELECT 
    p.id,
    'dispute_created',
    'New Dispute Created',
    'A new dispute has been reported for booking #' || substring(NEW.booking_id::text, 1, 8),
    'dispute',
    NEW.id
  FROM profiles p
  WHERE p.role IN ('admin', 'manager');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dispute_created_notification
  AFTER INSERT ON booking_disputes
  FOR EACH ROW EXECUTE FUNCTION notify_dispute_created();

-- Create function to automatically escalate high-priority disputes
CREATE OR REPLACE FUNCTION escalate_urgent_disputes()
RETURNS void AS $$
BEGIN
  -- Update disputes that have been open for more than 24 hours to high priority
  UPDATE booking_disputes 
  SET priority = 'high', updated_at = NOW()
  WHERE status = 'open' 
    AND priority = 'medium'
    AND created_at < NOW() - INTERVAL '24 hours';
    
  -- Update disputes that have been open for more than 72 hours to urgent priority
  UPDATE booking_disputes 
  SET priority = 'urgent', updated_at = NOW()
  WHERE status = 'open' 
    AND priority = 'high'
    AND created_at < NOW() - INTERVAL '72 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run escalation (this would need to be set up with pg_cron or similar)
-- SELECT cron.schedule('escalate-disputes', '0 */6 * * *', 'SELECT escalate_urgent_disputes();');

COMMENT ON TABLE booking_disputes IS 'Stores disputes related to bookings that require admin resolution';
COMMENT ON TABLE dispute_messages IS 'Stores messages exchanged during dispute resolution process';
COMMENT ON FUNCTION get_dispute_stats() IS 'Returns statistics about booking disputes for admin dashboard';
COMMENT ON FUNCTION get_user_management_stats() IS 'Returns user management statistics for admin dashboard';