ALTER TABLE public.teams
ADD CONSTRAINT teams_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id);
