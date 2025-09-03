CREATE OR REPLACE FUNCTION public.update_auth_user_metadata_from_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{role}',
    to_jsonb(NEW.role)
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_role_update
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.update_auth_user_metadata_from_profile();
