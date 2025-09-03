CREATE TABLE IF NOT EXISTS loft_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    ownership_type loft_ownership CHECK (ownership_type IN ('company', 'third_party')) DEFAULT 'third_party'::loft_ownership NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lofts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    price_per_month NUMERIC NOT NULL,
    status loft_status CHECK (status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available'::loft_status NOT NULL,
    owner_id UUID,
    company_percentage NUMERIC DEFAULT 50.00 NOT NULL,
    owner_percentage NUMERIC DEFAULT 50.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    zone_area_id UUID,
    FOREIGN KEY (owner_id) REFERENCES loft_owners(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_area_id) REFERENCES zone_areas(id) ON DELETE CASCADE,
    CONSTRAINT valid_percentage_split CHECK ((company_percentage + owner_percentage) = 100.00)
);
