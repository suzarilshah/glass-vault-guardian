-- Fix remaining functions with missing search_path
CREATE OR REPLACE FUNCTION public.get_expiring_trials(days_before integer DEFAULT 3)
RETURNS TABLE(user_id uuid, email text, trial_end timestamp with time zone, days_remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.initialize_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
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
$function$;