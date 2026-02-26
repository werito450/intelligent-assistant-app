
-- Create storage bucket for chat images (generated images)
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);

-- Anyone can view chat images
CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

-- Service role can upload (for edge functions)
CREATE POLICY "Service role can upload chat images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-images');
