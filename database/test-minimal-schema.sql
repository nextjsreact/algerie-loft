-- Test minimal schema to isolate syntax error
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL,
    date DATE NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT unique_loft_date UNIQUE (loft_id, date)
);

-- Test reservation locks table
CREATE TABLE IF NOT EXISTS reservation_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'released', 'converted'))
);