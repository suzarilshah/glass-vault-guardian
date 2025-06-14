
-- Create password_histories table for tracking password changes
CREATE TABLE public.password_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES password_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  password_encrypted text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.password_histories ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own password history
CREATE POLICY "Can view own password history" ON public.password_histories
FOR SELECT
USING (user_id = auth.uid());

-- Allow insert: user can insert rows for their own history
CREATE POLICY "Can insert own password history" ON public.password_histories
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow delete (optional, but often good to have)
CREATE POLICY "Can delete own password history" ON public.password_histories
FOR DELETE
USING (user_id = auth.uid());
