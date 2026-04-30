-- =====================================================
-- BACKLOG DE PRODUTO - Estrutura Completa
-- =====================================================

-- 1. CRIAR ENUMs
-- Categorias do item
CREATE TYPE backlog_categoria AS ENUM (
  'Nova Funcionalidade',
  'Melhoria de Funcionalidade Existente',
  'Correcao / Bug',
  'Ajuste Tecnico / Performance',
  'UX / UI / Visual',
  'Relatorios / Indicadores',
  'Seguranca / Permissoes',
  'Infraestrutura / Creditos / Limitacoes da Plataforma'
);

-- Status do backlog (pipeline completo)
CREATE TYPE backlog_status AS ENUM (
  'Ideia / Proposta',
  'Em Analise',
  'Refinado',
  'Aguardando Recursos / Creditos',
  'Em Implementacao',
  'Em Testes',
  'Implementado',
  'Lancado',
  'Validado',
  'Arquivado'
);

-- Prioridade
CREATE TYPE backlog_prioridade AS ENUM ('Alta', 'Media', 'Baixa');

-- Impacto
CREATE TYPE backlog_impacto AS ENUM ('Alto', 'Medio', 'Baixo');

-- Esforco
CREATE TYPE backlog_esforco AS ENUM ('Pequeno', 'Medio', 'Grande');

-- Tipo de validacao
CREATE TYPE backlog_tipo_validacao AS ENUM (
  'Teste funcional',
  'Validacao visual',
  'Validacao tecnica',
  'Validacao de regra de negocio'
);

-- 2. TABELA PRINCIPAL: backlog_itens
CREATE TABLE backlog_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  
  -- Classificacao
  produto_projeto TEXT NOT NULL DEFAULT 'Sistema Principal',
  categoria backlog_categoria NOT NULL,
  modulos TEXT[] DEFAULT '{}',
  
  -- Descricao Rica (Markdown)
  descricao_detalhada TEXT,
  
  -- Status
  status backlog_status NOT NULL DEFAULT 'Ideia / Proposta',
  
  -- Prioridade, Impacto, Esforco
  prioridade backlog_prioridade DEFAULT 'Media',
  impacto_esperado backlog_impacto DEFAULT 'Medio',
  estimativa_esforco backlog_esforco DEFAULT 'Medio',
  dependente_de_creditos BOOLEAN DEFAULT false,
  
  -- Responsabilidade
  responsavel_produto TEXT,
  responsavel_tecnico TEXT,
  
  -- Datas
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_inicio_implementacao TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  data_lancamento TIMESTAMPTZ,
  
  -- Validacao
  entrega_validada BOOLEAN DEFAULT false,
  data_validacao TIMESTAMPTZ,
  validado_por TEXT,
  tipo_validacao backlog_tipo_validacao,
  observacoes_validacao TEXT
);

-- Trigger para updated_at
CREATE TRIGGER update_backlog_itens_updated_at
  BEFORE UPDATE ON backlog_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. TABELA DE ANEXOS
CREATE TABLE backlog_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backlog_item_id UUID NOT NULL REFERENCES backlog_itens(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tamanho INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA DE CHANGELOG (Histórico Automático)
CREATE TABLE backlog_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backlog_item_id UUID NOT NULL REFERENCES backlog_itens(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  observacao TEXT,
  usuario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca rápida por item
CREATE INDEX idx_backlog_changelog_item ON backlog_changelog(backlog_item_id);

-- 5. TABELA DE REGISTROS DE IMPLEMENTAÇÃO
CREATE TABLE backlog_implementacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backlog_item_id UUID NOT NULL REFERENCES backlog_itens(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'Executado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABELA DE MÓDULOS/FUNCIONALIDADES (Cadastro por Projeto)
CREATE TABLE backlog_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_projeto TEXT NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(produto_projeto, nome)
);

-- 7. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE backlog_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_implementacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_modulos ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES DE ACESSO PÚBLICO (sem autenticação por enquanto)
CREATE POLICY "Acesso publico backlog_itens" ON backlog_itens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico backlog_anexos" ON backlog_anexos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico backlog_changelog" ON backlog_changelog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico backlog_implementacoes" ON backlog_implementacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso publico backlog_modulos" ON backlog_modulos FOR ALL USING (true) WITH CHECK (true);

-- 9. CRIAR STORAGE BUCKET PARA ANEXOS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('backlog-anexos', 'backlog-anexos', true);

-- Policy de acesso público para o bucket
CREATE POLICY "Acesso publico backlog-anexos"
ON storage.objects FOR ALL
USING (bucket_id = 'backlog-anexos')
WITH CHECK (bucket_id = 'backlog-anexos');

-- 10. INSERIR MÓDULOS PADRÃO PARA O PROJETO
INSERT INTO backlog_modulos (produto_projeto, nome) VALUES
  ('Sistema Principal', 'Visitas / Atendimentos'),
  ('Sistema Principal', 'Clientes'),
  ('Sistema Principal', 'Responsáveis'),
  ('Sistema Principal', 'Fotos'),
  ('Sistema Principal', 'Relatórios'),
  ('Sistema Principal', 'Dashboard'),
  ('Sistema Principal', 'Histórico'),
  ('Sistema Principal', 'Interface Mobile'),
  ('Sistema Principal', 'Interface Desktop'),
  ('Sistema Principal', 'Backlog');