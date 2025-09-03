-- Seed Categories
INSERT INTO public.categories (name, description, type) VALUES
('Salary', 'Monthly salary', 'income'),
('Freelance', 'Freelance work', 'income'),
('Rent', 'Monthly rent', 'expense'),
('Groceries', 'Groceries', 'expense'),
('Utilities', 'Utilities', 'expense');

-- Seed Currencies
INSERT INTO public.currencies (code, name, symbol, is_default, ratio) VALUES
('USD', 'US Dollar', '$', true, 1.0),
('EUR', 'Euro', '€', false, 0.92),
('DZD', 'Algerian Dinar', 'DA', false, 134.0);

-- Seed Zone Areas
INSERT INTO public.zone_areas (name) VALUES
('Algiers'),
('Oran'),
('Constantine');

-- Seed Loft Owners
INSERT INTO public.loft_owners (name, email, phone, address, ownership_type) VALUES
('Loft Algerie', 'contact@loftalgerie.com', '021234567', 'Algiers, Algeria', 'company'),
('Third Party Owner 1', 'owner1@example.com', '0555555555', 'Oran, Algeria', 'third_party');

-- Seed Lofts
INSERT INTO public.lofts (name, description, address, price_per_month, status, owner_id, company_percentage, owner_percentage, zone_area_id)
SELECT 'Loft 1', 'A beautiful loft in the city center', '123 Main St, Algiers', 50000, 'available', o.id, 10, 90, z.id
FROM public.loft_owners o, public.zone_areas z WHERE o.name = 'Loft Algerie' AND z.name = 'Algiers';

INSERT INTO public.lofts (name, description, address, price_per_month, status, owner_id, company_percentage, owner_percentage, zone_area_id)
SELECT 'Loft 2', 'A modern loft with a great view', '456 High St, Oran', 75000, 'occupied', o.id, 15, 85, z.id
FROM public.loft_owners o, public.zone_areas z WHERE o.name = 'Third Party Owner 1' AND z.name = 'Oran';

-- Seed Teams
INSERT INTO public.teams (name, description, created_by)
SELECT 'Maintenance Team', 'The team responsible for maintaining the lofts', id FROM public.profiles WHERE email = 'habib.belkacemi.mosta@gmail.com';

-- Seed Team Members
INSERT INTO public.team_members (team_id, user_id)
SELECT t.id, p.id FROM public.teams t, public.profiles p WHERE t.name = 'Maintenance Team' AND p.email = 'habib.belkacemi.mosta@gmail.com';

-- Seed Tasks
INSERT INTO public.tasks (title, description, status, due_date, assigned_to, team_id, loft_id, created_by)
SELECT 'Fix the leak in Loft 1', 'There is a leak in the bathroom of Loft 1', 'todo', '2025-07-15', p.id, t.id, l.id, p.id
FROM public.profiles p, public.teams t, public.lofts l WHERE p.email = 'habib.belkacemi.mosta@gmail.com' AND t.name = 'Maintenance Team' AND l.name = 'Loft 1';

-- Seed Payment Methods
INSERT INTO public.payment_methods (name, type, details) VALUES
('Cash', 'cash', null),
('Bank Transfer', 'bank_transfer', '{"bank": "BNP Paribas", "account_number": "123456789"}'),
('Credit Card', 'credit_card', null);
