
CREATE OR REPLACE FUNCTION public.check_expired_passwords()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (pg_trigger_depth() > 1) THEN
    RETURN NULL;
  END IF;

  -- Update is_expired flag based on expires_at
  UPDATE public.password_entries 
  SET is_expired = TRUE, updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_expired = FALSE;
  
  RETURN NULL;
END;
$function$
