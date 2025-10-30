-- Database Performance Optimization Indexes
-- This script creates optimized indexes for the reservation system
-- Based on requirements 1.9 from the reservation data consistency fix spec

-- ============================================================================
-- RESERVATIONS TABLE INDEXES
-- ============================================================================

-- Primary loft_id index (already exists but ensuring it's optimal)
CREATE INDEX IF NOT EXISTS idx_reservations_loft_id ON reservations(loft_id);

-- Composite index for loft status and availability queries
-- This supports queries filtering by loft and status together
CREATE INDEX IF NOT EXISTS idx_reservations_loft_status ON reservations(loft_id, status);

-- Composite index for date range queries in reservations
-- This is crucial for availability checking and overlapping reservation detection
CREATE INDEX IF NOT EXISTS idx_reservations_date_range ON reservations(check_in_date, check_out_date);

-- Composite index for loft availability queries with dates
-- Supports queries that check availability for specific lofts within date ranges
CREATE INDEX IF NOT EXISTS idx_reservations_loft_dates ON reservations(loft_id, check_in_date, check_out_date);

-- Index for status-based queries (confirmed/pending reservations)
CREATE INDEX IF NOT EXISTS idx_reservations_status_dates ON reservations(status, check_in_date, check_out_date);

-- Index for guest email lookups (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_reservations_guest_email ON reservations(guest_email);

-- Index for payment status queries
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);

-- Index for recent reservations (created_at)
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);

-- Partial index for active reservations (confirmed/pending only)
CREATE INDEX IF NOT EXISTS idx_reservations_active ON reservations(loft_id, check_in_date, check_out_date) 
WHERE status IN ('confirmed', 'pending');

-- ============================================================================
-- LOFTS TABLE INDEXES
-- ============================================================================

-- Composite index for loft status and availability queries
-- This supports queries filtering lofts by status and published state
CREATE INDEX IF NOT EXISTS idx_lofts_status_published ON lofts(status, is_published);

-- Index for published lofts only (partial index for better performance)
CREATE INDEX IF NOT EXISTS idx_lofts_published ON lofts(is_published, status) 
WHERE is_published = true;

-- Index for loft search by location/address
CREATE INDEX IF NOT EXISTS idx_lofts_address ON lofts(address);

-- Index for price-based searches
CREATE INDEX IF NOT EXISTS idx_lofts_price ON lofts(price_per_night);

-- Index for guest capacity searches
CREATE INDEX IF NOT EXISTS idx_lofts_max_guests ON lofts(max_guests);

-- Composite index for common search filters
CREATE INDEX IF NOT EXISTS idx_lofts_search ON lofts(is_published, status, max_guests, price_per_night) 
WHERE is_published = true AND status = 'available';

-- ============================================================================
-- LOFT_AVAILABILITY TABLE INDEXES
-- ============================================================================

-- Composite index for loft and date (already exists but ensuring it's optimal)
CREATE INDEX IF NOT EXISTS idx_loft_availability_loft_date ON loft_availability(loft_id, date);

-- Index for date-based availability queries
CREATE INDEX IF NOT EXISTS idx_loft_availability_date ON loft_availability(date);

-- Partial index for blocked dates only
CREATE INDEX IF NOT EXISTS idx_loft_availability_blocked ON loft_availability(loft_id, date) 
WHERE is_available = false;

-- Index for availability queries with date ranges
CREATE INDEX IF NOT EXISTS idx_loft_availability_date_range ON loft_availability(date, is_available);

-- ============================================================================
-- RESERVATION_PAYMENTS TABLE INDEXES
-- ============================================================================

-- Index for reservation payments lookup (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON reservation_payments(reservation_id);

-- Index for payment status queries (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_payments_status ON reservation_payments(status);

-- Index for payment processing queries
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON reservation_payments(created_at DESC);

-- Composite index for payment status and date
CREATE INDEX IF NOT EXISTS idx_payments_status_date ON reservation_payments(status, created_at);

-- ============================================================================
-- PRICING_RULES TABLE INDEXES
-- ============================================================================

-- Index for loft-specific pricing rules (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_pricing_rules_loft_id ON pricing_rules(loft_id);

-- Index for date-based pricing rules (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date);

-- Composite index for active pricing rules
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(loft_id, is_active, priority) 
WHERE is_active = true;

-- Index for rule type queries
CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type, is_active);

-- ============================================================================
-- GUEST_COMMUNICATIONS TABLE INDEXES
-- ============================================================================

-- Index for reservation communications (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_communications_reservation_id ON guest_communications(reservation_id);

-- Index for unread messages (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_communications_unread ON guest_communications(is_read) WHERE is_read = false;

-- Index for message type queries
CREATE INDEX IF NOT EXISTS idx_communications_type ON guest_communications(message_type, created_at);

-- Index for sender-based queries
CREATE INDEX IF NOT EXISTS idx_communications_sender ON guest_communications(sender_type, sender_id);

-- ============================================================================
-- RESERVATION_REVIEWS TABLE INDEXES
-- ============================================================================

-- Index for reservation reviews (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_reviews_reservation_id ON reservation_reviews(reservation_id);

-- Index for public reviews (already exists but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_reviews_public ON reservation_reviews(is_public) WHERE is_public = true;

-- Index for reviewer queries
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reservation_reviews(reviewer_type, reviewer_id);

-- Index for rating-based queries
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reservation_reviews(overall_rating, is_public);

-- ============================================================================
-- PERFORMANCE MONITORING INDEXES
-- ============================================================================

-- Index for monitoring reservation creation patterns
CREATE INDEX IF NOT EXISTS idx_reservations_monitoring ON reservations(created_at, status, loft_id);

-- Index for monitoring payment processing
CREATE INDEX IF NOT EXISTS idx_payments_monitoring ON reservation_payments(created_at, status, amount);

-- ============================================================================
-- ANALYZE TABLES FOR OPTIMAL QUERY PLANNING
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE reservations;
ANALYZE lofts;
ANALYZE loft_availability;
ANALYZE reservation_payments;
ANALYZE pricing_rules;
ANALYZE guest_communications;
ANALYZE reservation_reviews;

-- ============================================================================
-- INDEX USAGE MONITORING QUERIES
-- ============================================================================

-- Query to monitor index usage (for future optimization)
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_tup_read DESC;

-- Query to find unused indexes (for cleanup)
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0 AND schemaname = 'public';

COMMENT ON INDEX idx_reservations_loft_status IS 'Optimizes queries filtering by loft and status together';
COMMENT ON INDEX idx_reservations_date_range IS 'Critical for availability checking and overlapping reservation detection';
COMMENT ON INDEX idx_reservations_loft_dates IS 'Supports loft availability queries within date ranges';
COMMENT ON INDEX idx_reservations_active IS 'Partial index for active reservations only - improves availability checks';
COMMENT ON INDEX idx_lofts_status_published IS 'Composite index for loft status and published state queries';
COMMENT ON INDEX idx_lofts_search IS 'Optimized for common loft search filters';