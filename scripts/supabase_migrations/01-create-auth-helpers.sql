-- Create helper function to get user role from profiles table
CREATE OR REPLACE FUNCTION public.user_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid(); -- Use auth.uid() for Supabase
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
ALTER FUNCTION public.user_role() SET search_path = public, pg_temp;
