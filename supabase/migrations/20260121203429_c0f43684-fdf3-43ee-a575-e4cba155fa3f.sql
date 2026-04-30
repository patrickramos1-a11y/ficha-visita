-- Tabela de clientes/empresas
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de responsáveis técnicos
CREATE TABLE public.responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir os responsáveis técnicos padrão
INSERT INTO public.responsaveis (nome) VALUES 
  ('Patrick'),
  ('Darley'),
  ('Gabi'),
  ('Celine'),
  ('Vanessa');

-- Enum para os planos
CREATE TYPE public.plano_tipo AS ENUM ('VIP', 'Premium', 'Master', 'Integracao');

-- Enum para tipos de atendimento
CREATE TYPE public.atendimento_tipo AS ENUM (
  'Acompanhamento Ambiental',
  'ETE / ETA',
  'Tomada de Ciência',
  'Consultoria Ambiental',
  'Reunião de Alinhamento',
  'Planejamento de Ação',
  'Implementação de Melhoria',
  'Licenciamento Ambiental',
  'Fiscalização Ambiental',
  'Órgão Ambiental',
  'Treinamento Ambiental'
);

-- Tabela principal de atendimentos/visitas
CREATE TABLE public.atendimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES public.responsaveis(id) ON DELETE SET NULL,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  anotacoes TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  tipos_atendimento atendimento_tipo[] DEFAULT '{}',
  topicos_reuniao JSONB DEFAULT '[]'::jsonb,
  finalizado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fotos do atendimento
CREATE TABLE public.atendimento_fotos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atendimento_id UUID REFERENCES public.atendimentos(id) ON DELETE CASCADE NOT NULL,
  foto_url TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'durante', -- 'inicial', 'durante', 'final'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de demandas geradas nos atendimentos
CREATE TABLE public.demandas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atendimento_id UUID REFERENCES public.atendimentos(id) ON DELETE CASCADE NOT NULL,
  tipo_atendimento atendimento_tipo,
  descricao TEXT NOT NULL,
  plano plano_tipo,
  personalizada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimento_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - permitir acesso público para todas as operações (app interno sem autenticação por enquanto)
CREATE POLICY "Acesso público para clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público para responsaveis" ON public.responsaveis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público para atendimentos" ON public.atendimentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público para fotos" ON public.atendimento_fotos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público para demandas" ON public.demandas FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_atendimentos_updated_at
  BEFORE UPDATE ON public.atendimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demandas_updated_at
  BEFORE UPDATE ON public.demandas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para armazenar fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('atendimento-fotos', 'atendimento-fotos', true);

-- Política de storage para permitir upload de fotos
CREATE POLICY "Permitir upload público de fotos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'atendimento-fotos');
CREATE POLICY "Permitir leitura pública de fotos" ON storage.objects FOR SELECT USING (bucket_id = 'atendimento-fotos');
CREATE POLICY "Permitir atualização de fotos" ON storage.objects FOR UPDATE USING (bucket_id = 'atendimento-fotos');
CREATE POLICY "Permitir exclusão de fotos" ON storage.objects FOR DELETE USING (bucket_id = 'atendimento-fotos');