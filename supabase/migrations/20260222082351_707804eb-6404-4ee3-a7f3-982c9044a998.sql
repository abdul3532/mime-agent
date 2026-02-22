
-- 1. Create storefronts table
CREATE TABLE public.storefronts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id text UNIQUE NOT NULL,
  store_name text,
  store_url text,
  domain text,
  store_logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add storefront_id columns (nullable initially for migration)
ALTER TABLE public.products ADD COLUMN storefront_id uuid REFERENCES public.storefronts(id);
ALTER TABLE public.rules ADD COLUMN storefront_id uuid REFERENCES public.storefronts(id);
ALTER TABLE public.scrape_progress ADD COLUMN storefront_id uuid REFERENCES public.storefronts(id);
ALTER TABLE public.storefront_files ADD COLUMN storefront_id uuid REFERENCES public.storefronts(id);

-- 3. Migrate existing data from profiles into storefronts
INSERT INTO public.storefronts (user_id, store_id, store_name, store_url, domain, store_logo_url)
SELECT user_id, store_id, store_name, store_url, domain, store_logo_url
FROM public.profiles
WHERE store_id IS NOT NULL;

-- 4. Backfill storefront_id on existing rows
UPDATE public.products SET storefront_id = s.id
FROM public.storefronts s WHERE s.user_id = products.user_id;

UPDATE public.rules SET storefront_id = s.id
FROM public.storefronts s WHERE s.user_id = rules.user_id;

UPDATE public.scrape_progress SET storefront_id = s.id
FROM public.storefronts s WHERE s.user_id = scrape_progress.user_id;

UPDATE public.storefront_files SET storefront_id = s.id
FROM public.storefronts s WHERE s.user_id = storefront_files.user_id;

-- 5. Updated_at trigger for storefronts
CREATE TRIGGER update_storefronts_updated_at
BEFORE UPDATE ON public.storefronts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RLS on storefronts
ALTER TABLE public.storefronts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own storefronts"
ON public.storefronts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own storefronts"
ON public.storefronts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own storefronts"
ON public.storefronts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own storefronts"
ON public.storefronts FOR DELETE
USING (auth.uid() = user_id);
