DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin;
  END IF;
END$$;

-- Drop existing policies
DROP POLICY IF EXISTS select_profiles ON profiles;
DROP POLICY IF EXISTS insert_profiles ON profiles;
DROP POLICY IF EXISTS update_profiles ON profiles;
DROP POLICY IF EXISTS delete_profiles ON profiles;

DROP POLICY IF EXISTS select_lofts ON lofts;
DROP POLICY IF EXISTS manage_lofts ON lofts;
DROP POLICY IF EXISTS insert_lofts ON lofts;
DROP POLICY IF EXISTS update_lofts ON lofts;
DROP POLICY IF EXISTS delete_lofts ON lofts;

DROP POLICY IF EXISTS select_transactions ON transactions;
DROP POLICY IF EXISTS manage_transactions ON transactions;
DROP POLICY IF EXISTS insert_transactions ON transactions;
DROP POLICY IF EXISTS update_transactions ON transactions;
DROP POLICY IF EXISTS delete_transactions ON transactions;

DROP POLICY IF EXISTS select_tasks ON tasks;
DROP POLICY IF EXISTS manage_tasks ON tasks;
DROP POLICY IF EXISTS insert_tasks ON tasks;
DROP POLICY IF EXISTS update_tasks ON tasks;
DROP POLICY IF EXISTS delete_tasks ON tasks;

DROP POLICY IF EXISTS all_admin_access_loft_owners ON loft_owners;
DROP POLICY IF EXISTS select_loft_owners ON loft_owners;

DROP POLICY IF EXISTS all_admin_access_zone_areas ON zone_areas;
DROP POLICY IF EXISTS select_zone_areas ON zone_areas;

DROP POLICY IF EXISTS all_admin_access_categories ON categories;
DROP POLICY IF EXISTS select_categories ON categories;

DROP POLICY IF EXISTS all_admin_access_currencies ON currencies;
DROP POLICY IF EXISTS select_currencies ON currencies;

DROP POLICY IF EXISTS all_admin_access_teams ON teams;
DROP POLICY IF EXISTS select_teams ON teams;

DROP POLICY IF EXISTS all_admin_access_team_members ON team_members;
DROP POLICY IF EXISTS select_team_members ON team_members;

DROP POLICY IF EXISTS "Allow all access to all users" ON payment_methods;

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lofts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE loft_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_areas ENABLE ROW LEVEL SECURITY;

-- Define Policies for all tables
CREATE POLICY "Allow all access to all users" ON profiles FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON lofts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON transactions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON tasks FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON loft_owners FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON categories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON currencies FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON teams FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON team_members FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON zone_areas FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all access to all users" ON payment_methods FOR ALL USING (auth.uid() IS NOT NULL);
