-- Task Budget Control System Schema
-- This creates budget reference amounts and automatic alerts for task cost overruns

-- Create task categories budget reference table
CREATE TABLE IF NOT EXISTS task_categories_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL UNIQUE,
  reference_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tolerance_warning_percent INTEGER DEFAULT 20, -- Warning at +20%
  tolerance_critical_percent INTEGER DEFAULT 50, -- Critical at +50%
  currency VARCHAR(3) DEFAULT 'DZD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Create task budget alerts history table
CREATE TABLE IF NOT EXISTS task_budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  category_name VARCHAR(100) NOT NULL,
  reference_amount DECIMAL(10,2) NOT NULL,
  actual_amount DECIMAL(10,2) NOT NULL,
  variance_amount DECIMAL(10,2) NOT NULL, -- Difference
  variance_percent DECIMAL(5,2) NOT NULL, -- Percentage difference
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('info', 'warning', 'critical')),
  alert_message TEXT NOT NULL,
  notified_users UUID[] DEFAULT '{}', -- Array of user IDs notified
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  task_title VARCHAR(255),
  loft_name VARCHAR(255)
);

-- Add budget-related columns to tasks table if they don't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget_checked BOOLEAN DEFAULT false;

-- Insert default task categories with reference amounts
INSERT INTO task_categories_budget (category_name, reference_amount, tolerance_warning_percent, tolerance_critical_percent) VALUES
('Plomberie', 15000.00, 25, 60),           -- Plumbing
('Électricité', 12000.00, 20, 50),         -- Electrical
('Peinture', 8000.00, 30, 70),             -- Painting
('Nettoyage', 3000.00, 40, 80),            -- Cleaning
('Réparation Générale', 10000.00, 25, 55), -- General Repair
('Climatisation', 20000.00, 20, 45),       -- Air Conditioning
('Menuiserie', 18000.00, 25, 60),          -- Carpentry
('Jardinage', 5000.00, 35, 75),            -- Gardening
('Sécurité', 25000.00, 15, 40),            -- Security
('Maintenance Préventive', 7000.00, 30, 65) -- Preventive Maintenance
ON CONFLICT (category_name) DO NOTHING;

-- Function to calculate budget variance and determine alert type
CREATE OR REPLACE FUNCTION calculate_budget_variance(
  actual_amount DECIMAL(10,2),
  reference_amount DECIMAL(10,2),
  warning_percent INTEGER,
  critical_percent INTEGER
)
RETURNS TABLE(
  variance_amount DECIMAL(10,2),
  variance_percent DECIMAL(5,2),
  alert_type VARCHAR(20),
  alert_message TEXT
) AS $$
DECLARE
  var_amount DECIMAL(10,2);
  var_percent DECIMAL(5,2);
  alert_level VARCHAR(20);
  message TEXT;
BEGIN
  -- Calculate variance
  var_amount := actual_amount - reference_amount;
  var_percent := CASE 
    WHEN reference_amount > 0 THEN (var_amount / reference_amount) * 100
    ELSE 0
  END;
  
  -- Determine alert type and message
  IF var_percent >= critical_percent THEN
    alert_level := 'critical';
    message := format('🚨 DÉPASSEMENT CRITIQUE: +%s%% (+%s DZD) par rapport au budget de référence', 
                     ROUND(var_percent, 1), var_amount);
  ELSIF var_percent >= warning_percent THEN
    alert_level := 'warning';
    message := format('⚠️ DÉPASSEMENT IMPORTANT: +%s%% (+%s DZD) par rapport au budget de référence', 
                     ROUND(var_percent, 1), var_amount);
  ELSIF var_percent <= -20 THEN
    alert_level := 'info';
    message := format('ℹ️ SOUS-BUDGET: %s%% (%s DZD) en dessous du budget de référence', 
                     ROUND(ABS(var_percent), 1), ABS(var_amount));
  ELSE
    alert_level := 'info';
    message := format('✅ BUDGET RESPECTÉ: %s%% par rapport au budget de référence', 
                     ROUND(var_percent, 1));
  END IF;
  
  RETURN QUERY SELECT var_amount, var_percent, alert_level, message;
END;
$$ LANGUAGE plpgsql;

-- Function to check task budget and create alerts
CREATE OR REPLACE FUNCTION check_task_budget()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
  variance_record RECORD;
  admin_users UUID[];
  alert_id UUID;
  loft_name_val VARCHAR(255);
BEGIN
  -- Only check if amount is provided and category exists
  IF NEW.amount IS NOT NULL AND NEW.amount > 0 AND NEW.category IS NOT NULL THEN
    
    -- Get budget reference for this category
    SELECT * INTO budget_record 
    FROM task_categories_budget 
    WHERE category_name = NEW.category AND is_active = true;
    
    IF FOUND THEN
      -- Calculate variance
      SELECT * INTO variance_record 
      FROM calculate_budget_variance(
        NEW.amount, 
        budget_record.reference_amount,
        budget_record.tolerance_warning_percent,
        budget_record.tolerance_critical_percent
      );
      
      -- Get loft name if task is associated with a loft
      IF NEW.loft_id IS NOT NULL THEN
        SELECT name INTO loft_name_val FROM lofts WHERE id = NEW.loft_id;
      END IF;
      
      -- Create alert record if there's a significant variance
      IF variance_record.alert_type IN ('warning', 'critical') OR ABS(variance_record.variance_percent) >= 20 THEN
        INSERT INTO task_budget_alerts (
          task_id, category_name, reference_amount, actual_amount,
          variance_amount, variance_percent, alert_type, alert_message,
          task_title, loft_name
        ) VALUES (
          NEW.id, NEW.category, budget_record.reference_amount, NEW.amount,
          variance_record.variance_amount, variance_record.variance_percent,
          variance_record.alert_type, variance_record.alert_message,
          NEW.title, loft_name_val
        ) RETURNING id INTO alert_id;
        
        -- Get admin users for notification
        SELECT ARRAY_AGG(id) INTO admin_users
        FROM profiles 
        WHERE role IN ('admin', 'manager');
        
        -- Send notifications to admins for warning and critical alerts
        IF variance_record.alert_type IN ('warning', 'critical') AND admin_users IS NOT NULL THEN
          -- Insert notifications for each admin
          INSERT INTO notifications (user_id, title, message, type, link, is_read)
          SELECT 
            unnest(admin_users),
            format('💰 Alerte Budget - %s', NEW.category),
            format('%s\n\nTâche: %s\n%s\nMontant saisi: %s DZD\nBudget référence: %s DZD\nÉcart: %s DZD (%s%%)',
                   variance_record.alert_message,
                   NEW.title,
                   CASE WHEN loft_name_val IS NOT NULL THEN 'Loft: ' || loft_name_val ELSE 'Aucun loft associé' END,
                   NEW.amount,
                   budget_record.reference_amount,
                   variance_record.variance_amount,
                   ROUND(variance_record.variance_percent, 1)
            ),
            CASE variance_record.alert_type
              WHEN 'critical' THEN 'error'
              WHEN 'warning' THEN 'warning'
              ELSE 'info'
            END,
            '/tasks/' || NEW.id,
            false;
          
          -- Update alert record with notified users
          UPDATE task_budget_alerts 
          SET notified_users = admin_users 
          WHERE id = alert_id;
        END IF;
      END IF;
      
      -- Mark task as budget checked
      NEW.budget_checked := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for budget checking
DROP TRIGGER IF EXISTS trigger_check_task_budget ON tasks;
CREATE TRIGGER trigger_check_task_budget
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_task_budget();

-- Function to get budget statistics
CREATE OR REPLACE FUNCTION get_budget_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  total_tasks INTEGER,
  tasks_over_budget INTEGER,
  tasks_under_budget INTEGER,
  average_variance_percent DECIMAL(5,2),
  total_overspend DECIMAL(10,2),
  most_problematic_category VARCHAR(100),
  alerts_sent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total_count,
      COUNT(CASE WHEN variance_percent > 0 THEN 1 END) as over_count,
      COUNT(CASE WHEN variance_percent < -20 THEN 1 END) as under_count,
      AVG(variance_percent) as avg_variance,
      SUM(CASE WHEN variance_amount > 0 THEN variance_amount ELSE 0 END) as total_over,
      COUNT(CASE WHEN alert_type IN ('warning', 'critical') THEN 1 END) as alert_count
    FROM task_budget_alerts
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
  ),
  top_category AS (
    SELECT category_name
    FROM task_budget_alerts
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
      AND alert_type IN ('warning', 'critical')
    GROUP BY category_name
    ORDER BY COUNT(*) DESC, AVG(variance_percent) DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(s.total_count, 0)::INTEGER,
    COALESCE(s.over_count, 0)::INTEGER,
    COALESCE(s.under_count, 0)::INTEGER,
    COALESCE(s.avg_variance, 0)::DECIMAL(5,2),
    COALESCE(s.total_over, 0)::DECIMAL(10,2),
    COALESCE(tc.category_name, 'Aucune')::VARCHAR(100),
    COALESCE(s.alert_count, 0)::INTEGER
  FROM stats s
  CROSS JOIN top_category tc;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_budget_alerts_created_at ON task_budget_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_task_budget_alerts_alert_type ON task_budget_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_task_budget_alerts_category ON task_budget_alerts(category_name);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_amount ON tasks(amount) WHERE amount IS NOT NULL;

-- Enable RLS on new tables
ALTER TABLE task_categories_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_budget_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage budget categories" ON task_categories_budget
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view budget alerts" ON task_budget_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager', 'user')
    )
  );

CREATE POLICY "System can insert budget alerts" ON task_budget_alerts
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON task_categories_budget TO authenticated;
GRANT ALL ON task_budget_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_budget_variance(DECIMAL, DECIMAL, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_task_budget() TO authenticated;
GRANT EXECUTE ON FUNCTION get_budget_statistics(INTEGER) TO authenticated;

SELECT 'Task budget control system created successfully!' as status;