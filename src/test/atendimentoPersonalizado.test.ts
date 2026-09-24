import { describe, expect, it } from 'vitest';
import {
  canonicalPersonalizadoResponse,
  derivePersonalizadoActivitySelections,
  shouldIncludePersonalizadoModule,
} from '@/lib/atendimentoPersonalizado';
import type { AtendimentoPersonalizadoData, AtendimentoPersonalizadoItem } from '@/types/atendimento';

const item: AtendimentoPersonalizadoItem = {
  id: 'item-residuos',
  modulo_id: 'modulo-residuos',
  texto: 'Os resíduos comuns estão devidamente acondicionados?',
  tipo_resposta: 'CONFORMIDADE',
  exige_foto: false,
  permite_observacao: true,
  entra_conformidade: true,
  ordem: 1,
  ativo: true,
};

const data: AtendimentoPersonalizadoData = {
  atendimento_personalizado_id: 'ficha-pca',
  atendimento_personalizado_nome: 'Inspeção PCA - Posto Av. Brasil',
  cliente_id: 'cliente-posto',
  tipos: [
    { id: 'tipo-residuos', nome: 'Gerenciamento de resíduos', ordem: 1, ativo: true },
  ],
  acoes: [
    { id: 'acao-comum', nome: 'Verificar resíduos comuns', ordem: 1, ativo: true },
    { id: 'acao-fossa', nome: 'Inspecionar fossa séptica', ordem: 2, ativo: true },
  ],
  modulos: [
    {
      id: 'modulo-residuos',
      atendimento_personalizado_id: 'ficha-pca',
      titulo: 'Gerenciamento de resíduos',
      ordem: 2,
      entra_conformidade: true,
      ativo: true,
      itens: [item],
    },
  ],
  respostas: [
    { modulo_id: 'modulo-residuos', item_id: 'item-residuos', resposta: 'ADEQUADO' },
  ],
};

describe('atendimento personalizado', () => {
  it('preenche tipos e ações quando o módulo fica completo', () => {
    expect(derivePersonalizadoActivitySelections(data)).toEqual({
      tipos: ['Gerenciamento de resíduos'],
      acoes: ['Verificar resíduos comuns'],
    });
  });

  it('mantém os módulos removidos fora da ficha PCA', () => {
    expect(shouldIncludePersonalizadoModule(data, {
      id: 'encerramento',
      atendimento_personalizado_id: data.atendimento_personalizado_id,
      titulo: 'Encerramento da ficha',
      ordem: 13,
      entra_conformidade: true,
      ativo: true,
    })).toBe(false);
  });

  it('interpreta respostas antigas conforme a polaridade original', () => {
    expect(canonicalPersonalizadoResponse({
      ...item,
      tipo_resposta: 'SIM_NAO_EVENTO',
      resposta_positiva: 'NAO',
    }, 'NAO')).toBe('ADEQUADO');
  });
});
