-- Emergency contacts table for urgent guest support
-- This table stores emergency contact requests from active guests

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Emergency details
  emergency_type VARCHAR(50) NOT NULL CHECK (emergency_type IN ('maintenance', 'security', 'medical', 'access', 'other')),
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'urgent' CHECK (priority IN ('urgent', 'high', 'normal')),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  
  -- Guest information
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50) NOT NULL,
  guest_email VARCHAR(255),
  
  -- Booking context
  booking_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  loft_id UUID REFERENCES lofts(id) ON DELETE SET NULL,
  
  -- Response tracking
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Technical details
  client_ip INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_status ON emergency_contacts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_priority ON emergency_contacts(priority);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_type ON emergency_contacts(emergency_type);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_created_at ON emergency_contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_booking_id ON emergency_contacts(booking_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_loft_id ON emergency_contacts(loft_id);

-- Composite index for active emergencies
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active ON emergency_contacts(status, priority, created_at DESC) 
WHERE status IN ('new', 'acknowledged', 'in_progress');

-- RLS (Row Level Security) policies
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Policy for emergency staff to view all emergencies
CREATE POLICY "Emergency staff can view all emergencies" ON emergency_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'manager', 'support', 'emergency_staff')
    )
  );

-- Policy for emergency staff to update emergencies
CREATE POLICY "Emergency staff can update emergencies" ON emergency_contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'manager', 'support', 'emergency_staff')
    )
  );

-- Policy for system to insert emergency requests (public access for guests)
CREATE POLICY "Anyone can create emergency requests" ON emergency_contacts
  FOR INSERT WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_emergency_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_contacts_updated_at();

-- Function to automatically acknowledge emergency when status changes
CREATE OR REPLACE FUNCTION acknowledge_emergency_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Set acknowledged_at when status changes from 'new' to any other status
  IF OLD.status = 'new' AND NEW.status != 'new' AND NEW.acknowledged_at IS NULL THEN
    NEW.acknowledged_at = NOW();
    NEW.acknowledged_by = auth.uid();
  END IF;
  
  -- Set resolved_at when status changes to 'resolved' or 'closed'
  IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at = NOW();
    NEW.resolved_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic acknowledgment
CREATE TRIGGER emergency_contacts_acknowledge
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION acknowledge_emergency_contact();

-- View for emergency dashboard (for support staff)
CREATE OR REPLACE VIEW emergency_dashboard AS
SELECT 
  ec.*,
  r.guest_name as booking_guest_name,
  r.check_in_date,
  r.check_out_date,
  l.name as loft_name,
  l.address as loft_address,
  EXTRACT(EPOCH FROM (NOW() - ec.created_at))/60 as minutes_since_created,
  CASE 
    WHEN ec.status = 'new' AND EXTRACT(EPOCH FROM (NOW() - ec.created_at))/60 > 5 THEN 'overdue'
    WHEN ec.status = 'new' AND EXTRACT(EPOCH FROM (NOW() - ec.created_at))/60 > 2 THEN 'urgent'
    ELSE 'normal'
  END as urgency_level
FROM emergency_contacts ec
LEFT JOIN reservations r ON ec.booking_id = r.id
LEFT JOIN lofts l ON ec.loft_id = l.id
ORDER BY 
  CASE ec.priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    ELSE 3 
  END,
  ec.created_at DESC;

-- Function to get emergency statistics
CREATE OR REPLACE FUNCTION get_emergency_stats(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_emergencies BIGINT,
  new_emergencies BIGINT,
  resolved_emergencies BIGINT,
  avg_response_time_minutes NUMERIC,
  emergencies_by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_emergencies,
    COUNT(*) FILTER (WHERE status = 'new') as new_emergencies,
    COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) as resolved_emergencies,
    ROUND(AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))/60), 2) as avg_response_time_minutes,
    jsonb_object_agg(emergency_type, type_count) as emergencies_by_type
  FROM (
    SELECT 
      emergency_type,
      COUNT(*) as type_count,
      acknowledged_at,
      created_at,
      status
    FROM emergency_contacts 
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY emergency_type, acknowledged_at, created_at, status
  ) subquery;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON emergency_contacts TO authenticated;
GRANT INSERT ON emergency_contacts TO anon, authenticated;
GRANT UPDATE ON emergency_contacts TO authenticated;
GRANT SELECT ON emergency_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_emergency_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE emergency_contacts IS 'Emergency contact requests from guests during their stay';
COMMENT ON COLUMN emergency_contacts.emergency_type IS 'Type of emergency: maintenance, security, medical, access, other';
COMMENT ON COLUMN emergency_contacts.priority IS 'Priority level: urgent, high, normal';
COMMENT ON COLUMN emergency_contacts.status IS 'Current status: new, acknowledged, in_progress, resolved, closed';
COMMENT ON VIEW emergency_dashboard IS 'Dashboard view for support staff to manage emergencies';
COMMENT ON FUNCTION get_emergency_stats IS 'Get emergency statistics for a date range';