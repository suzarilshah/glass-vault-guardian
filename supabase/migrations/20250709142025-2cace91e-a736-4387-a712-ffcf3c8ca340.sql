-- Add trial functionality to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN trial_end TIMESTAMPTZ,
ADD COLUMN is_trial BOOLEAN DEFAULT false;

-- Update existing free users to have completed trials (so they don't get trial benefits)
UPDATE public.subscribers 
SET is_trial = false, trial_end = NULL
WHERE subscription_tier = 'free' AND subscribed = false;

-- Create function to initialize trial for new users
CREATE OR REPLACE FUNCTION public.initialize_user_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Set 30-day trial for new users
  INSERT INTO public.subscribers (
    email,
    user_id,
    subscribed,
    subscription_tier,
    is_trial,
    trial_end,
    created_at,
    updated_at
  ) VALUES (
    NEW.email,
    NEW.id,
    false,
    'trial',
    true,
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set up trial for new users
DROP TRIGGER IF EXISTS on_auth_user_trial_created ON auth.users;
CREATE TRIGGER on_auth_user_trial_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_trial();

-- Create function to check for expiring trials (for email reminders)
CREATE OR REPLACE FUNCTION public.get_expiring_trials(days_before INTEGER DEFAULT 3)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  trial_end TIMESTAMPTZ,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.user_id,
    s.email,
    s.trial_end,
    EXTRACT(days FROM s.trial_end - NOW())::INTEGER as days_remaining
  FROM public.subscribers s
  WHERE s.is_trial = true 
    AND s.trial_end IS NOT NULL
    AND s.trial_end > NOW()
    AND s.trial_end <= NOW() + (days_before || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;