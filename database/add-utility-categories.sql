-- Add utility bill categories to support bill payments
-- Run this in your Supabase SQL editor

-- Insert utility bill categories
INSERT INTO public.categories (name, description, type) VALUES
('Water Bill', 'Water utility bill payment', 'expense'),
('Energy Bill', 'Energy/Electricity utility bill payment', 'expense'),
('Phone Bill', 'Phone utility bill payment', 'expense'),
('Internet Bill', 'Internet utility bill payment', 'expense'),
('Gas Bill', 'Gas utility bill payment', 'expense')
ON CONFLICT (name) DO NOTHING;

-- Update existing utilities category if it exists
UPDATE public.categories 
SET description = 'General utilities (use specific categories for better tracking)'
WHERE name = 'Utilities';

SELECT 'Utility bill categories added successfully!' as status;