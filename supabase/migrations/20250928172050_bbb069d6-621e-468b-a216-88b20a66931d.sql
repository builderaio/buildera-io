-- Create content-files bucket for campaign content uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('content-files', 'content-files', true);

-- Create RLS policies for content-files bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own content files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own files
CREATE POLICY "Users can view their own content files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own files
CREATE POLICY "Users can update their own content files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own content files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to files (since bucket is public)
CREATE POLICY "Public can view content files" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'content-files');