-- Create storage bucket for content library
INSERT INTO storage.buckets (id, name, public) VALUES ('content-library', 'content-library', true);

-- Create content_library table for storing downloaded assets
CREATE TABLE IF NOT EXISTS public.content_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  original_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size BIGINT NOT NULL DEFAULT 0,
  title TEXT NULL,
  description TEXT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on content_library
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content_library
CREATE POLICY "Users can view their own content library" 
ON public.content_library 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content library" 
ON public.content_library 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content library" 
ON public.content_library 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content library" 
ON public.content_library 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage policies for content-library bucket
CREATE POLICY "Users can view their own content library files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'content-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own content library files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'content-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own content library files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'content-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own content library files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'content-library' AND auth.uid()::text = (storage.foldername(name))[1]);