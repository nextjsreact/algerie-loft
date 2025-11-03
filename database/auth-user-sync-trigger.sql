-- =====================================================
-- AUTO-SYNC AUTH.USERS TO CUSTOMERS TABLE
-- =====================================================
-- This trigger automatically creates customer records when users sign up
-- with role='client' in their metadata

-- Function to sync auth.users to customers table
CREATE OR REPLACE FUNCTION sync_auth_user_to_customer()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    full_name TEXT;
    first_name TEXT;
    last_name TEXT;
    user_phone TEXT;
    client_prefs JSONB;
BEGIN
    -- Only process if this is an INSERT (new user)
    IF TG_OP = 'INSERT' THEN
        -- Extract role from user metadata
        user_role := COALESCE(NEW.raw_user_meta_data->>'role', '');
        
        -- Only create customer record for client users
        IF user_role = 'client' THEN
            -- Extract user data from metadata
            full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Client');
            user_phone := NEW.raw_user_meta_data->>'phone';
            client_prefs := COALESCE(
                NEW.raw_user_meta_data->'client_preferences',
                '{"language": "fr", "currency": "DZD", "notifications": {"email": true, "sms": false, "marketing": false}}'::jsonb
            );
            
            -- Split full name into first and last name
            first_name := SPLIT_PART(full_name, ' ', 1);
            last_name := TRIM(SUBSTRING(full_name FROM LENGTH(first_name) + 2));
            
            -- If no last name, use first name as last name
            IF last_name = '' THEN
                last_name := first_name;
            END IF;
            
            -- Insert into customers table
            INSERT INTO public.customers (
                id,
                first_name,
                last_name,
                email,
                phone,
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
                user_phone,
                'prospect',
                COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
                client_prefs,
                NEW.id,
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
                updated_at = NOW();
                
            RAISE LOG 'Created customer record for user %', NEW.id;
        END IF;
    END IF;
    
    -- For UPDATE operations, sync email verification status
    IF TG_OP = 'UPDATE' THEN
        user_role := COALESCE(NEW.raw_user_meta_data->>'role', '');
        
        IF user_role = 'client' THEN
            UPDATE public.customers 
            SET 
                email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
                updated_at = NOW()
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS sync_auth_user_to_customer_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_to_customer_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_auth_user_to_customer();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- Test the trigger with a sample (commented out for safety)
/*
-- Test insert (uncomment to test)
INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test@example.com',
    '{"role": "client", "full_name": "Test Client", "phone": "+213123456789"}'::jsonb,
    NOW(),
    NOW()
);
*/

SELECT 'Auth user to customer sync trigger created successfully! 🎉' as status,
       'Trigger: sync_auth_user_to_customer_trigger' as trigger_name,
       'Function: sync_auth_user_to_customer()' as function_name;