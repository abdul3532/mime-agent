-- Enable realtime for agent_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_events;

-- Allow anonymous inserts for tracking pixel (no auth required)
CREATE POLICY "Allow anonymous event inserts"
ON public.agent_events
FOR INSERT
TO anon
WITH CHECK (true);
