
-- Add missing columns to user_master_passwords table
ALTER TABLE public.user_master_passwords 
ADD COLUMN vault_type text DEFAULT 'password',
ADD COLUMN use_unified_password boolean DEFAULT true;

-- Create index for better performance on vault_type queries
CREATE INDEX idx_user_master_passwords_vault_type ON public.user_master_passwords(user_id, vault_type);
CREATE INDEX idx_user_master_passwords_unified ON public.user_master_passwords(user_id, use_unified_password);
