-- Fix subscribers table RLS policies for security
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

CREATE POLICY "Users can insert their own subscription"
ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id OR email = auth.email());

-- Add search_path security to database functions
CREATE OR REPLACE FUNCTION public.check_expired_passwords()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (pg_trigger_depth() > 1) THEN
    RETURN NULL;
  END IF;

  UPDATE public.password_entries 
  SET is_expired = TRUE, updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_expired = FALSE;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_expired_api_keys()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (pg_trigger_depth() > 1) THEN
    RETURN NULL;
  END IF;

  UPDATE public.api_entries 
  SET is_expired = TRUE, updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_expired = FALSE;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_expired_certificates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (pg_trigger_depth() > 1) THEN
    RETURN NULL;
  END IF;

  UPDATE public.certificate_entries 
  SET is_expired = TRUE, updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_expired = FALSE;
  
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.user_usage 
  SET ai_password_generations = 0, ai_password_analyses = 0, updated_at = now()
  WHERE usage_date < CURRENT_DATE;
END;
$function$;