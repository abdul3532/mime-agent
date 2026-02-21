
-- Replace the overly permissive policy with one that only allows service role writes
DROP POLICY "Service role can manage progress" ON public.scrape_progress;

-- Only allow inserts/updates via service role (which bypasses RLS anyway)
-- Users can only SELECT their own progress (already covered)
-- No direct INSERT/UPDATE/DELETE for regular users
