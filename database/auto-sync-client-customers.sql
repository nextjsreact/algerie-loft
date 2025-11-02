-- =====================================================
-- AUTO-SYNC CLIENT CUSTOMERS TRIGGER
-- =====================================================
-- This trigger automatically creates a customer record when a client user is created in auth.users

-- =====================================================
-- 1. CREATE TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION sync_client_to_customers()
RETURNS TRIGGER AS $
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
            jsonb_build_object(
                'language', 'fr',
                'currency', 'DZD',
                'notifications', jsonb_build_object(
                    'email', true,
                    'sms', false,
                    'marketing', false
                )
            ),
            NEW.id,
            NEW.created_at,
            NEW.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            email_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            updated_at = NEW.updated_at;
            
        -- Log the sync
        RAISE NOTICE 'Client user % synced to customers table', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE TRIGGER ON auth.users
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_client_customers_trigger ON auth.users;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER sync_client_customers_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_client_to_customers();

-- =====================================================
-- 3. CREATE FUNCTION TO SYNC EXISTING USERS
-- =====================================================

CREATE OR REPLACE FUNCTION sync_existing_client_users()
RETURNS TABLE(
    synced_count INTEGER,
    message TEXT
) AS $
DECLARE
    sync_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Loop through all client users in auth.users
    FOR user_record IN 
        SELECT * FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'client'
    LOOP
        -- Check if customer record already exists
        IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = user_record.id) THEN
            -- Trigger the sync function manually
            PERFORM sync_client_to_customers() FROM (SELECT user_record.*) AS NEW;
            sync_count := sync_count + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT sync_count, format('Synced %s existing client users to customers table', sync_count);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION sync_client_to_customers() TO service_role;
GRANT EXECUTE ON FUNCTION sync_existing_client_users() TO service_role;

-- Grant necessary permissions for the trigger function
GRANT SELECT, INSERT, UPDATE ON public.customers TO postgres;

-- =====================================================
-- 5. TEST THE SYNC FUNCTION
-- =====================================================

-- Uncomment the following line to sync existing users
-- SELECT * FROM sync_existing_client_users();

-- =====================================================
-- 6. VERIFICATION
-- =====================================================

SELECT 
    'Auto-sync trigger created successfully! ✅' as status,
    'Trigger: sync_client_customers_trigger' as trigger_name,
    'Function: sync_client_to_customers()' as function_name,
    'All new client users will be automatically synced to customers table' as description;

-- Show trigger information
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'sync_client_customers_trigger';