-- Crear buckets para contenido multimedia
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('content-media', 'content-media', true, 20971520, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('content-videos', 'content-videos', true, 20971520, ARRAY['video/mp4', 'video/quicktime', 'video/mov', 'video/avi']),
  ('content-documents', 'content-documents', true, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para content-media (imágenes)
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'content-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-media');

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas RLS para content-videos
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'content-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-videos');

CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas RLS para content-documents (PDFs)
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'content-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-documents');

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);