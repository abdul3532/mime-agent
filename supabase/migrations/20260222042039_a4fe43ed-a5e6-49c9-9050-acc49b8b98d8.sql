
-- 1. Add columns to products
ALTER TABLE public.products
  ADD COLUMN agent_notes TEXT DEFAULT NULL,
  ADD COLUMN variants JSONB DEFAULT NULL;

-- 2. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN merchandising_intent JSONB DEFAULT NULL,
  ADD COLUMN snippet_installed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN store_id TEXT DEFAULT NULL;

-- 3. Create private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('storefront-files', 'storefront-files', false);

-- 4. Create storefront_files table
CREATE TABLE public.storefront_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id TEXT NOT NULL,
  llms_txt TEXT,
  llms_full_txt TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  product_count INTEGER DEFAULT 0,
  section_count INTEGER DEFAULT 0
);

ALTER TABLE public.storefront_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own storefront files"
  ON public.storefront_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own storefront files"
  ON public.storefront_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own storefront files"
  ON public.storefront_files FOR UPDATE
  USING (auth.uid() = user_id);
