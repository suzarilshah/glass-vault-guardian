
-- Create a table for password groups
CREATE TABLE public.password_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add group_id and expiration fields to password_entries
ALTER TABLE public.password_entries 
ADD COLUMN group_id UUID REFERENCES public.password_groups ON DELETE SET NULL,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_expired BOOLEAN DEFAULT FALSE;

-- Enable RLS for password groups
ALTER TABLE public.password_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for password groups
CREATE POLICY "Users can view their own password groups" 
  ON public.password_groups 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own password groups" 
  ON public.password_groups 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own password groups" 
  ON public.password_groups 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own password groups" 
  ON public.password_groups 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a function to check and update expired passwords
CREATE OR REPLACE FUNCTION public.check_expired_passwords()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update is_expired flag based on expires_at
  UPDATE public.password_entries 
  SET is_expired = TRUE, updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_expired = FALSE;
  
  RETURN NULL;
END;
$$;

-- Create a trigger to check for expired passwords on password_entries updates
CREATE TRIGGER check_password_expiration
  AFTER INSERT OR UPDATE ON public.password_entries
  FOR EACH STATEMENT EXECUTE FUNCTION public.check_expired_passwords();
