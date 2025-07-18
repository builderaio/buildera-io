-- Drop the incorrect user_files table and user-files bucket
DROP TABLE IF EXISTS public.user_files;
DELETE FROM storage.buckets WHERE id = 'user-files';

-- Create company_files table for company document management
CREATE TABLE public.company_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  is_confidential BOOLEAN DEFAULT true,
  is_encrypted BOOLEAN DEFAULT true,
  access_level TEXT DEFAULT 'private' CHECK (access_level IN ('private', 'internal', 'restricted')),
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company files
CREATE POLICY "Users can view their own company files" 
ON public.company_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company files" 
ON public.company_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company files" 
ON public.company_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company files" 
ON public.company_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for company files
INSERT INTO storage.buckets (id, name, public) VALUES ('company-files', 'company-files', false);

-- Create storage policies for company files
CREATE POLICY "Users can view their own company files in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own company files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own company files in storage" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own company files in storage" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_files_updated_at
BEFORE UPDATE ON public.company_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();