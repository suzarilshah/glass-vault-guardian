
-- Add deactivated_at column to profiles table for account deactivation
ALTER TABLE public.profiles 
ADD COLUMN deactivated_at timestamp with time zone DEFAULT NULL;

-- Add index for better performance when querying active users
CREATE INDEX idx_profiles_deactivated_at ON public.profiles(deactivated_at);
