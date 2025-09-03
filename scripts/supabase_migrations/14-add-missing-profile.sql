INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('728772d1-543b-4e8c-9150-6c84203a0e16', 'habib.belkacemi.mosta@gmail.com', 'Habibo', 'member')
ON CONFLICT (id) DO NOTHING;
