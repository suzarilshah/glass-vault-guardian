
-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create usage tracking table for free plan rate limiting
CREATE TABLE public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_password_generations INTEGER DEFAULT 0,
  ai_password_analyses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (true);

CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Create policies for user_usage
CREATE POLICY "select_own_usage" ON public.user_usage
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "update_own_usage" ON public.user_usage
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "insert_own_usage" ON public.user_usage
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Function to reset daily usage at midnight GMT
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function can be called by a cron job or edge function
  -- to reset usage counters daily at midnight GMT
  UPDATE public.user_usage 
  SET ai_password_generations = 0, ai_password_analyses = 0, updated_at = now()
  WHERE usage_date < CURRENT_DATE;
END;
$$;
