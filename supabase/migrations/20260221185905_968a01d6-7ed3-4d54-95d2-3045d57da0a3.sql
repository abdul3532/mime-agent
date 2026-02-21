-- Create storage bucket for store logos
INSERT INTO storage.buckets (id, name, public) VALUES ('store-logos', 'store-logos', true);

-- Allow authenticated users to upload their own logo
CREATE POLICY "Users can upload own logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'store-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own logo
CREATE POLICY "Users can update own logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'store-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own logo
CREATE POLICY "Users can delete own logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'store-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to store logos
CREATE POLICY "Store logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-logos');
