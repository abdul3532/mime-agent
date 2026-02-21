
-- Table to track scraping progress in real-time
CREATE TABLE public.scrape_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  run_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'mapping', -- mapping, scraping, extracting, saving, done, error
  total_urls INTEGER NOT NULL DEFAULT 0,
  scraped_pages INTEGER NOT NULL DEFAULT 0,
  extracted_products INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scrape_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.scrape_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage progress" ON public.scrape_progress
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_scrape_progress_run ON public.scrape_progress(run_id);
CREATE INDEX idx_scrape_progress_user ON public.scrape_progress(user_id);
