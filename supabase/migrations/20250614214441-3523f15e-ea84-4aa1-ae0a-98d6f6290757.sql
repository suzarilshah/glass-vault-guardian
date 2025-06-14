
-- Create table for API entries
CREATE TABLE public.api_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  api_name TEXT,
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT,
  endpoint_url TEXT,
  description TEXT,
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  group_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for API groups
CREATE TABLE public.api_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for API key history
CREATE TABLE public.api_histories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL,
  user_id UUID NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.api_entries 
ADD CONSTRAINT api_entries_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.api_groups(id) ON DELETE SET NULL;

ALTER TABLE public.api_histories 
ADD CONSTRAINT api_histories_entry_id_fkey 
FOREIGN KEY (entry_id) REFERENCES public.api_entries(id) ON DELETE CASCADE;

-- Enable Row Level Security for api_entries
ALTER TABLE public.api_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_entries
CREATE POLICY "Users can view their own API entries" 
  ON public.api_entries 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API entries" 
  ON public.api_entries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API entries" 
  ON public.api_entries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API entries" 
  ON public.api_entries 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable Row Level Security for api_groups
ALTER TABLE public.api_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_groups
CREATE POLICY "Users can view their own API groups" 
  ON public.api_groups 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API groups" 
  ON public.api_groups 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API groups" 
  ON public.api_groups 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API groups" 
  ON public.api_groups 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable Row Level Security for api_histories
ALTER TABLE public.api_histories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_histories
CREATE POLICY "Users can view their own API histories" 
  ON public.api_histories 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API histories" 
  ON public.api_histories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to check expired API keys
CREATE OR REPLACE FUNCTION public.check_expired_api_keys()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF (pg_trigger_depth() > 1) THEN
    RETURN NULL;
  END IF;

  -- Update is_expired flag based on expires_at
  UPDATE public.api_entries 
  SET is_expired = TRUE, updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_expired = FALSE;
  
  RETURN NULL;
END;
$function$;

-- Create trigger for expired API keys check
CREATE TRIGGER check_expired_api_keys_trigger
  AFTER INSERT OR UPDATE ON public.api_entries
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.check_expired_api_keys();
