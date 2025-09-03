ALTER TABLE public.internet_connection_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read internet connection types"
ON public.internet_connection_types
FOR SELECT
TO authenticated
USING (true);
