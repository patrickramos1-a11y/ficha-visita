
-- 1. Create tipos_atendimento_config table
CREATE TABLE public.tipos_atendimento_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  plano_id uuid REFERENCES public.planos(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tipos_atendimento_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico tipos_atendimento_config" ON public.tipos_atendimento_config FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_tipos_atendimento_config_updated_at BEFORE UPDATE ON public.tipos_atendimento_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create acoes_especificas_config table
CREATE TABLE public.acoes_especificas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  plano_id uuid REFERENCES public.planos(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.acoes_especificas_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico acoes_especificas_config" ON public.acoes_especificas_config FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_acoes_especificas_config_updated_at BEFORE UPDATE ON public.acoes_especificas_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Convert atendimentos.tipos_atendimento from enum array to text array
ALTER TABLE public.atendimentos ADD COLUMN tipos_atendimento_new text[] DEFAULT '{}'::text[];
UPDATE public.atendimentos SET tipos_atendimento_new = tipos_atendimento::text[];
ALTER TABLE public.atendimentos DROP COLUMN tipos_atendimento;
ALTER TABLE public.atendimentos RENAME COLUMN tipos_atendimento_new TO tipos_atendimento;

-- 4. Convert demandas.tipo_atendimento from enum to text
ALTER TABLE public.demandas ADD COLUMN tipo_atendimento_new text;
UPDATE public.demandas SET tipo_atendimento_new = tipo_atendimento::text;
ALTER TABLE public.demandas DROP COLUMN tipo_atendimento;
ALTER TABLE public.demandas RENAME COLUMN tipo_atendimento_new TO tipo_atendimento;

-- 5. Drop the now-unused enum (if exists)
DROP TYPE IF EXISTS public.atendimento_tipo;

-- 6. Seed tipos_atendimento_config
INSERT INTO public.tipos_atendimento_config (nome, descricao, plano_id) VALUES
  ('Acompanhamento Ambiental', 'Verificação de conformidades ambientais e acompanhamento das rotinas do empreendimento.', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('ETE / ETA', 'Avaliação do funcionamento da estação de tratamento e identificação de necessidades de ajuste.', (SELECT id FROM public.planos WHERE nome = 'Premium' LIMIT 1)),
  ('Tomada de Ciência', 'Análise inicial de problema ou demanda apresentada pelo cliente.', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Consultoria Ambiental', 'Orientação técnica ambiental e esclarecimento de dúvidas do cliente.', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Reunião de Alinhamento', 'Alinhamento de demandas, escopo e próximos passos.', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Planejamento de Ação', 'Definição de soluções e priorização de ações ambientais.', (SELECT id FROM public.planos WHERE nome = 'Premium' LIMIT 1)),
  ('Implementação de Melhoria', 'Acompanhamento da execução de melhorias ambientais.', (SELECT id FROM public.planos WHERE nome = 'Master' LIMIT 1)),
  ('Licenciamento Ambiental', 'Acompanhamento de processo de licenciamento e vistoria técnica.', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Fiscalização Ambiental', 'Acompanhamento de fiscalização ambiental e análise de exigências.', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Órgão Ambiental', 'Protocolo, reunião ou acompanhamento de processo junto ao órgão ambiental.', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Treinamento Ambiental', 'Capacitação ambiental e orientação de procedimentos.', (SELECT id FROM public.planos WHERE nome = 'Premium' LIMIT 1))
ON CONFLICT (nome) DO NOTHING;

-- 7. Seed acoes_especificas_config
INSERT INTO public.acoes_especificas_config (nome, plano_id) VALUES
  ('Acompanhar obra da ETE', (SELECT id FROM public.planos WHERE nome = 'Premium' LIMIT 1)),
  ('Acom. obra da fábrica', (SELECT id FROM public.planos WHERE nome = 'Premium' LIMIT 1)),
  ('Ac. reforma da estação', (SELECT id FROM public.planos WHERE nome = 'Premium' LIMIT 1)),
  ('Ac. ampliação de sistema', (SELECT id FROM public.planos WHERE nome = 'Premium' LIMIT 1)),
  ('Verificar estrutura física da ETE', (SELECT id FROM public.planos WHERE nome = 'Premium' LIMIT 1)),
  ('Verificar operação em campo', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Atuar em área externa', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Atuar em área de resíduos', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Atuar em área de efluentes', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1)),
  ('Atuar em frente documental', (SELECT id FROM public.planos WHERE nome = 'VIP' LIMIT 1))
ON CONFLICT (nome) DO NOTHING;
