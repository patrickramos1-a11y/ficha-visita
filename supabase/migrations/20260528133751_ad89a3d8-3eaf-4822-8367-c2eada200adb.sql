ALTER TABLE public.demandas
ADD COLUMN IF NOT EXISTS topico_id uuid,
ADD COLUMN IF NOT EXISTS subtopico_id uuid;