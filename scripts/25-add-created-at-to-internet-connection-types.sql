ALTER TABLE public.internet_connection_types
ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
