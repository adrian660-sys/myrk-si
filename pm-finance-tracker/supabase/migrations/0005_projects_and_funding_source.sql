-- Projects: long-running research projects that receive funds (cash or bank).
-- Same pattern as Trips, but for non-travel funding flows (research payments,
-- grants, contract milestones).
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_receipts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  funding_source text NOT NULL CHECK (funding_source IN ('Cash', 'DH', 'Revolut')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read projects"
  ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can write projects"
  ON public.projects FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated can read project_receipts"
  ON public.project_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can write project_receipts"
  ON public.project_receipts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Cash received on a trip can now arrive as Cash, DH, or Revolut.
-- Default existing rows to Cash since that's what the column used to imply.
ALTER TABLE public.cash_received
  ADD COLUMN IF NOT EXISTS funding_source text
  NOT NULL DEFAULT 'Cash'
  CHECK (funding_source IN ('Cash', 'DH', 'Revolut'));
