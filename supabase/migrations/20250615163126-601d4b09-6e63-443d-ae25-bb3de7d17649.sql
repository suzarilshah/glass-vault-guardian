
-- Create certificate_groups table (similar to password_groups and api_groups)
CREATE TABLE public.certificate_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certificate_entries table
CREATE TABLE public.certificate_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  certificate_file_encrypted TEXT NOT NULL,
  private_key_encrypted TEXT,
  passphrase_encrypted TEXT,
  common_name TEXT,
  issuer TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  certificate_type TEXT DEFAULT 'ssl',
  environment TEXT DEFAULT 'production',
  group_id UUID REFERENCES public.certificate_groups(id) ON DELETE SET NULL,
  is_expired BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certificate_histories table for tracking changes
CREATE TABLE public.certificate_histories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.certificate_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  certificate_file_encrypted TEXT NOT NULL,
  private_key_encrypted TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all certificate tables
ALTER TABLE public.certificate_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_histories ENABLE ROW LEVEL SECURITY;

-- RLS policies for certificate_groups
CREATE POLICY "Users can view their own certificate groups" 
  ON public.certificate_groups 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificate groups" 
  ON public.certificate_groups 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certificate groups" 
  ON public.certificate_groups 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certificate groups" 
  ON public.certificate_groups 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for certificate_entries
CREATE POLICY "Users can view their own certificate entries" 
  ON public.certificate_entries 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificate entries" 
  ON public.certificate_entries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certificate entries" 
  ON public.certificate_entries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certificate entries" 
  ON public.certificate_entries 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for certificate_histories
CREATE POLICY "Users can view their own certificate histories" 
  ON public.certificate_histories 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificate histories" 
  ON public.certificate_histories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add trigger to check for expired certificates (similar to password expiration)
CREATE OR REPLACE FUNCTION public.check_expired_certificates()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF (pg_trigger_depth() > 1) THEN
    RETURN NULL;
  END IF;

  -- Update is_expired flag based on expires_at
  UPDATE public.certificate_entries 
  SET is_expired = TRUE, updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_expired = FALSE;
  
  RETURN NULL;
END;
$function$;

-- Create trigger to periodically check for expired certificates
CREATE OR REPLACE TRIGGER check_certificate_expiration
  AFTER INSERT OR UPDATE ON public.certificate_entries
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.check_expired_certificates();

-- Create storage bucket for certificate files
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false);

-- Storage policies for certificate files
CREATE POLICY "Users can upload their own certificate files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own certificate files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own certificate files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own certificate files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
