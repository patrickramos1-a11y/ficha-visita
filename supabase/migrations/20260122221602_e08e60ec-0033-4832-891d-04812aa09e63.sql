-- Tabela de relacionamento atendimento-clientes (N:N)
CREATE TABLE public.atendimento_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  atendimento_id UUID NOT NULL REFERENCES atendimentos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(atendimento_id, cliente_id)
);

-- Adicionar coluna para ações específicas
ALTER TABLE public.atendimentos 
ADD COLUMN IF NOT EXISTS acoes_especificas TEXT[] DEFAULT '{}';

-- Adicionar campo para indicar se tem foto final
ALTER TABLE public.atendimentos 
ADD COLUMN IF NOT EXISTS possui_foto_final BOOLEAN DEFAULT false;

-- RLS policies para nova tabela
ALTER TABLE public.atendimento_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público para atendimento_clientes" 
ON public.atendimento_clientes 
FOR ALL 
USING (true) 
WITH CHECK (true);