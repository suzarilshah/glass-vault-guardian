
-- Add fields for first name, last name, and full name to the profiles table, plus an optional avatar
ALTER TABLE public.profiles
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT,
  ADD COLUMN full_name TEXT,
  ADD COLUMN avatar_url TEXT;

-- Optionally, update RLS policies if needed (existing policies should allow users to update own profile).
