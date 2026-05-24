-- Research payments and other bank income (DH / Revolut).
-- Cash income is tracked separately via cash_received (per-trip fresh cash).
CREATE TABLE IF NOT EXISTS public.income_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  description text NOT NULL DEFAULT 'Research Payment',
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  funding_source text NOT NULL CHECK (funding_source IN ('DH', 'Revolut')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read income_records"
  ON public.income_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can insert income_records"
  ON public.income_records FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update income_records"
  ON public.income_records FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete income_records"
  ON public.income_records FOR DELETE TO authenticated
  USING (public.is_admin());
