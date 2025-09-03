DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    CREATE TABLE public.payment_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type TEXT,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;

  -- Recreate trigger only if the table exists and trigger doesn't
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') AND
     NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'public.payment_methods'::regclass) THEN
    CREATE TRIGGER handle_updated_at
      BEFORE UPDATE ON public.payment_methods
      FOR EACH ROW
      EXECUTE PROCEDURE moddatetime (updated_at);
  END IF;
END$$;
