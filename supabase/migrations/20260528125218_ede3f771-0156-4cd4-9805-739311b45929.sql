ALTER TABLE public.tipos_atendimento_config 
  ADD COLUMN IF NOT EXISTS topico_id uuid,
  ADD COLUMN IF NOT EXISTS subtopico_id uuid;

ALTER TABLE public.acoes_especificas_config 
  ADD COLUMN IF NOT EXISTS topico_id uuid,
  ADD COLUMN IF NOT EXISTS subtopico_id uuid;