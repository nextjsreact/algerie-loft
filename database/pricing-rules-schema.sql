-- Pricing Rules System for Dynamic Pricing
-- This schema supports seasonal rates, weekend pricing, holiday rates, and length-of-stay discounts

-- Create pricing rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL REFERENCES lofts(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('seasonal', 'weekend', 'holiday', 'event', 'length_of_stay', 'advance_booking')),
    
    -- Date range (optional for some rule types)
    start_date DATE,
    end_date DATE,
    
    -- Days of week (for weekend rules) - Array of integers 0-6 (Sunday-Saturday)
    days_of_week INTEGER[],
    
    -- Minimum stay requirements
    minimum_nights INTEGER,
    maximum_nights INTEGER,
    
    -- Advance booking requirements (days in advance)
    advance_booking_days INTEGER,
    
    -- Pricing adjustments
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed_amount', 'override')),
    adjustment_value DECIMAL(10,2) NOT NULL,
    
    -- Priority for overlapping rules (higher number = higher priority)
    priority INTEGER NOT NULL DEFAULT 0,
    
    -- Rule status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_loft_id ON pricing_rules(loft_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority DESC);

-- Create trigger for updated_at
CREATE TRIGGER trigger_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate dynamic price for a loft on a specific date
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
    p_loft_id UUID,
    p_date DATE,
    p_nights INTEGER DEFAULT 1,
    p_advance_days INTEGER DEFAULT 0
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    base_price DECIMAL(10,2);
    final_price DECIMAL(10,2);
    rule_record RECORD;
    day_of_week INTEGER;
BEGIN
    -- Get base price from loft
    SELECT price_per_night INTO base_price
    FROM lofts
    WHERE id = p_loft_id;
    
    IF base_price IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Check for price override in loft_availability first
    SELECT price_override INTO final_price
    FROM loft_availability
    WHERE loft_id = p_loft_id AND date = p_date AND price_override IS NOT NULL;
    
    -- If no override, start with base price
    IF final_price IS NULL THEN
        final_price := base_price;
    END IF;
    
    -- Get day of week (0 = Sunday, 6 = Saturday)
    day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Apply pricing rules in priority order
    FOR rule_record IN
        SELECT *
        FROM pricing_rules
        WHERE loft_id = p_loft_id
        AND is_active = true
        AND (
            -- Seasonal rules
            (rule_type = 'seasonal' AND p_date >= start_date AND p_date <= end_date)
            OR
            -- Weekend rules
            (rule_type = 'weekend' AND day_of_week = ANY(days_of_week))
            OR
            -- Holiday/Event rules
            (rule_type IN ('holiday', 'event') AND p_date >= start_date AND p_date <= end_date)
            OR
            -- Length of stay rules
            (rule_type = 'length_of_stay' AND p_nights >= minimum_nights AND (maximum_nights IS NULL OR p_nights <= maximum_nights))
            OR
            -- Advance booking rules
            (rule_type = 'advance_booking' AND p_advance_days >= advance_booking_days)
        )
        ORDER BY priority DESC, created_at ASC
    LOOP
        -- Apply the pricing adjustment
        CASE rule_record.adjustment_type
            WHEN 'percentage' THEN
                final_price := final_price * (1 + rule_record.adjustment_value / 100);
            WHEN 'fixed_amount' THEN
                final_price := final_price + rule_record.adjustment_value;
            WHEN 'override' THEN
                final_price := rule_record.adjustment_value;
        END CASE;
    END LOOP;
    
    -- Ensure price is not negative
    IF final_price < 0 THEN
        final_price := 0;
    END IF;
    
    RETURN ROUND(final_price, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get pricing rules for a loft
CREATE OR REPLACE FUNCTION get_loft_pricing_rules(p_loft_id UUID)
RETURNS TABLE (
    id UUID,
    rule_name VARCHAR(255),
    rule_type VARCHAR(20),
    start_date DATE,
    end_date DATE,
    days_of_week INTEGER[],
    minimum_nights INTEGER,
    maximum_nights INTEGER,
    advance_booking_days INTEGER,
    adjustment_type VARCHAR(20),
    adjustment_value DECIMAL(10,2),
    priority INTEGER,
    is_active BOOLEAN,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.rule_name,
        pr.rule_type,
        pr.start_date,
        pr.end_date,
        pr.days_of_week,
        pr.minimum_nights,
        pr.maximum_nights,
        pr.advance_booking_days,
        pr.adjustment_type,
        pr.adjustment_value,
        pr.priority,
        pr.is_active,
        pr.description
    FROM pricing_rules pr
    WHERE pr.loft_id = p_loft_id
    ORDER BY pr.priority DESC, pr.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Partners can manage pricing rules for their own lofts
CREATE POLICY "Partners can manage own loft pricing rules" ON pricing_rules
    FOR ALL USING (user_owns_loft(loft_id));

-- Admins and managers can manage all pricing rules
CREATE POLICY "Admins can manage all pricing rules" ON pricing_rules
    FOR ALL USING (get_current_user_role() IN ('admin', 'manager'));

-- Everyone can view active pricing rules (for price calculation)
CREATE POLICY "Public can view active pricing rules" ON pricing_rules
    FOR SELECT TO authenticated USING (is_active = true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_dynamic_price(UUID, DATE, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_loft_pricing_rules(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE pricing_rules IS 'Dynamic pricing rules for lofts including seasonal rates, weekend pricing, and length-of-stay discounts';
COMMENT ON FUNCTION calculate_dynamic_price IS 'Calculates the dynamic price for a loft on a specific date considering all applicable pricing rules';
COMMENT ON FUNCTION get_loft_pricing_rules IS 'Returns all pricing rules for a specific loft ordered by priority';