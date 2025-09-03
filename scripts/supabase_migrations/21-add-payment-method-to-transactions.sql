ALTER TABLE public.transactions
ADD COLUMN payment_method_id UUID,
ADD CONSTRAINT transactions_payment_method_id_fkey
FOREIGN KEY (payment_method_id)
REFERENCES public.payment_methods(id);
