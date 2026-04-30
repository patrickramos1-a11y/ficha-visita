
-- =====================================================
-- FASE 1: Tabelas mestras de configuração
-- =====================================================

-- Tabela de Planos (substitui o enum plano_tipo para configuração)
CREATE TABLE public.planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cor text NOT NULL DEFAULT '#188840',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico planos" ON public.planos FOR ALL USING (true) WITH CHECK (true);

-- Seed planos padrão
INSERT INTO public.planos (nome, cor) VALUES
  ('VIP', '#60B070'),
  ('Premium', '#188840'),
  ('Master', '#206030');

-- Tabela de Tópicos
CREATE TABLE public.topicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.topicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico topicos" ON public.topicos FOR ALL USING (true) WITH CHECK (true);

-- Tabela de Subtópicos
CREATE TABLE public.subtopicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topico_id uuid REFERENCES public.topicos(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subtopicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico subtopicos" ON public.subtopicos FOR ALL USING (true) WITH CHECK (true);

-- Tabela de Origens
CREATE TABLE public.origens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.origens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico origens" ON public.origens FOR ALL USING (true) WITH CHECK (true);

-- Seed origens padrão
INSERT INTO public.origens (nome) VALUES
  ('Plano de Ação'),
  ('Avulso'),
  ('Visita / Atendimento'),
  ('Ficha'),
  ('Plano'),
  ('Plano SST'),
  ('Reunião');

-- Tabela de Status de Configuração
CREATE TABLE public.status_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.status_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico status_config" ON public.status_config FOR ALL USING (true) WITH CHECK (true);

-- Seed status padrão
INSERT INTO public.status_config (nome) VALUES
  ('Cancelado'),
  ('Concluído'),
  ('Em Execução'),
  ('Não Feito');

-- Tabela de Demandas Específicas (catálogo mestre)
CREATE TABLE public.demandas_especificas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_curto text NOT NULL,
  descricao_detalhada text,
  plano_id uuid REFERENCES public.planos(id) ON DELETE SET NULL,
  topico_id uuid REFERENCES public.topicos(id) ON DELETE SET NULL,
  subtopico_id uuid REFERENCES public.subtopicos(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.demandas_especificas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico demandas_especificas" ON public.demandas_especificas FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_demandas_especificas_updated_at
  BEFORE UPDATE ON public.demandas_especificas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FASE 2: Tabela de Visitas (evolução do atendimentos)
-- =====================================================

-- Adicionar campos faltantes ao atendimentos existente
ALTER TABLE public.atendimentos
  ADD COLUMN IF NOT EXISTS origem_id uuid REFERENCES public.origens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notas text,
  ADD COLUMN IF NOT EXISTS link_publico text UNIQUE;

-- Tabela de vínculo visita ↔ demanda específica
CREATE TABLE public.visita_demandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id uuid REFERENCES public.atendimentos(id) ON DELETE CASCADE NOT NULL,
  demanda_especifica_id uuid REFERENCES public.demandas_especificas(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.visita_demandas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso publico visita_demandas" ON public.visita_demandas FOR ALL USING (true) WITH CHECK (true);

-- Gerar link_publico automaticamente para novos atendimentos
CREATE OR REPLACE FUNCTION public.generate_link_publico()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.link_publico IS NULL THEN
    NEW.link_publico := encode(gen_random_bytes(12), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_link_publico
  BEFORE INSERT ON public.atendimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_link_publico();
