
-- Create separate API groups table
CREATE TABLE public.api_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for API groups
ALTER TABLE public.api_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for API groups
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

-- Update API entries to reference the new API groups table
ALTER TABLE public.api_entries 
DROP CONSTRAINT IF EXISTS api_entries_group_id_fkey,
ADD CONSTRAINT api_entries_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.api_groups(id) ON DELETE SET NULL;

-- Migrate existing groups from password_groups to api_groups for API entries
INSERT INTO public.api_groups (id, user_id, name, description, created_at, updated_at)
SELECT DISTINCT pg.id, pg.user_id, pg.name, pg.description, pg.created_at, pg.updated_at
FROM public.password_groups pg
INNER JOIN public.api_entries ae ON pg.id = ae.group_id;

-- Clean up any orphaned group references in api_entries that don't exist in api_groups
UPDATE public.api_entries 
SET group_id = NULL 
WHERE group_id IS NOT NULL 
AND group_id NOT IN (SELECT id FROM public.api_groups);
