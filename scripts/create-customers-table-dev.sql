-- Create customers table in DEV environment
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all customers
CREATE POLICY "Users can view all customers" ON public.customers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert customers
CREATE POLICY "Users can insert customers" ON public.customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update customers
CREATE POLICY "Users can update customers" ON public.customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete customers
CREATE POLICY "Users can delete customers" ON public.customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();