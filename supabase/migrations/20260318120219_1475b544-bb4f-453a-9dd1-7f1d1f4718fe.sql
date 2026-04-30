
CREATE OR REPLACE FUNCTION public.generate_link_publico()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.link_publico IS NULL THEN
    NEW.link_publico := encode(extensions.gen_random_bytes(12), 'hex');
  END IF;
  RETURN NEW;
END;
$function$;
