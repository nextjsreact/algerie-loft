-- =====================================================
-- SIMPLE AUTO-SYNC TRIGGER - SUPABASE COMPATIBLE
-- =====================================================
-- This creates a trigger to automatically sync client users to customers table

-- =====================================================
-- 1. CREATE TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION sync_client_to_customers()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    full_name TEXT;
    first_name TEXT;
    last_name TEXT;
BEGIN
    -- Get user role from metadata
    user_role := NEW.raw_user_meta_data->>'role';
    
    -- Only process if user is a client
    IF user_role = 'client' THEN
        -- Extract name information
        full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
        
        -- Split full name into first and last name
        first_name := split_part(full_name, ' ', 1);
        last_name := CASE 
            WHEN position(' ' in full_name) > 0 THEN 
                substring(full_name from position(' ' in full_name) + 1)
            ELSE 
                first_name
        END;
        
        -- Insert into customers table
        INSERT INTO public.customers (
            id,
            first_name,
            last_name,
            email,
            status,
            email_verified,
            preferences,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            first_name,
            last_name,
            NEW.email,
            'prospect',
            CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            '{"language": "fr", "currency": "DZD", "notifications": {"email": true, "sms": false, "marketing": false}}'::jsonb,
            NEW.id,
            NEW.created_at,
            NEW.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            email_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            updated_at = NEW.updated_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE TRIGGER
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_client_customers_trigger ON auth.users;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER sync_client_customers_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_client_to_customers();

-- =====================================================
-- 3. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_client_to_customers() TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.customers TO postgres;

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

SELECT 'Auto-sync trigger created successfully! ✅' as status;

-- Show trigger information
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'sync_client_customers_trigger';