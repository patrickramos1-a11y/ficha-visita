ALTER TABLE public.tipos_atendimento_config
  ADD CONSTRAINT tipos_atendimento_config_topico_id_fkey
  FOREIGN KEY (topico_id) REFERENCES public.topicos(id) ON DELETE SET NULL;

ALTER TABLE public.tipos_atendimento_config
  ADD CONSTRAINT tipos_atendimento_config_subtopico_id_fkey
  FOREIGN KEY (subtopico_id) REFERENCES public.subtopicos(id) ON DELETE SET NULL;

ALTER TABLE public.acoes_especificas_config
  ADD CONSTRAINT acoes_especificas_config_topico_id_fkey
  FOREIGN KEY (topico_id) REFERENCES public.topicos(id) ON DELETE SET NULL;

ALTER TABLE public.acoes_especificas_config
  ADD CONSTRAINT acoes_especificas_config_subtopico_id_fkey
  FOREIGN KEY (subtopico_id) REFERENCES public.subtopicos(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';