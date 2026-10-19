import { describe, expect, it } from 'vitest';
import { buildVisitServiceNarratives, canonicalizeActionConfigs, canonicalizeTypeConfigs, getAvailableActionsForTypes } from './serviceNarrative';

describe('service narrative', () => {
  it('assigns a shared action only once and keeps the visit context', () => {
    const result = buildVisitServiceNarratives({
      date: '2026-10-18T12:00:00Z',
      responsible: 'Patrick',
      clients: ['Cliente Exemplo'],
      selectedTypes: ['Reunião de alinhamento técnico', 'Consultoria ambiental'],
      selectedActions: ['Alinhar tecnicamente', 'Analisar situação ou documentação'],
    });

    expect(result).toHaveLength(2);
    expect(result.flatMap((item) => item.acoes)).toEqual(['Alinhar tecnicamente', 'Analisar situação ou documentação']);
    expect(result[0].texto).toContain('18/10/2026');
    expect(result[0].texto).toContain('Patrick');
    expect(result[0].texto).toContain('Cliente Exemplo');
  });

  it('filters and prioritizes actions from persisted links', () => {
    const actions = getAvailableActionsForTypes({
      tipos: [{ id: 't1', nome: 'Tipo 1' }],
      acoes: [{ id: 'a2', nome: 'Complementar' }, { id: 'a1', nome: 'Principal' }],
      selectedTypeNames: ['Tipo 1'],
      links: [
        { tipo_id: 't1', acao_id: 'a2', principal: false, prioridade: 2, ativo: true },
        { tipo_id: 't1', acao_id: 'a1', principal: true, prioridade: 10, ativo: true },
      ],
    });

    expect(actions.map((item) => item.nome)).toEqual(['Principal', 'Complementar']);
    expect(actions.map((item) => item.relationLabel)).toEqual(['Principal', 'Complementar']);
  });

  it('keeps legacy unmapped visits in one concise service block', () => {
    const result = buildVisitServiceNarratives({
      selectedTypes: ['Inspeção PCA', 'Gerenciamento de resíduos'],
      selectedActions: ['Verificar resíduos comuns', 'Verificar resíduos contaminados'],
    });

    expect(result).toHaveLength(1);
    expect(result[0].tipo).toBe('Inspeção PCA');
    expect(result[0].acoes).toHaveLength(2);
  });

  it('exposes exactly the canonical 12 types and 21 actions before the database migration', () => {
    const typeNames = [
      'Acompanhamento Ambiental', 'ETE / ETA', 'Tomada de Ciência', 'Consultoria Ambiental',
      'Reunião de Alinhamento', 'Planejamento de Ação', 'Implementação de Melhoria',
      'Licenciamento ambiental', 'Fiscalização Ambiental', 'Treinamento ambiental',
      'Levantamento de campo', 'Monitoramento ambiental', 'Gestão de resíduos',
    ];
    const actionNames = [
      'Reunir com cliente', 'Analisar documentação', 'Definir próximos passos', 'Levantar informações em campo',
      'Realizar diagnóstico', 'Revisar situação ambiental', 'Coletar evidências', 'Registrar pendências',
      'Orientar cliente ou equipe', 'Acompanhar obra da ETE', 'Agendar vistoria', 'Consultar andamento do processo',
      'Protocolar documento', 'Esclarecer exigência técnica', 'Solicitar prioridade ou análise',
      'Complementar documentação', 'Retirar licença ou documento', 'Atualizar status de demanda',
      'Repassar orientação em campo', 'Indicar correção em campo', 'Reunir com responsável técnico',
    ];
    const types = canonicalizeTypeConfigs(typeNames.map((nome, index) => ({ id: `t${index}`, nome, ativo: index !== 0, naturezas: ['ATENDIMENTO'] })));
    const actions = canonicalizeActionConfigs(actionNames.map((nome, index) => ({ id: `a${index}`, nome, ativo: true, naturezas: ['ATENDIMENTO'] })));

    expect(types.filter((item) => item.naturezas?.includes('ATENDIMENTO'))).toHaveLength(12);
    expect(actions.filter((item) => item.naturezas?.includes('ATENDIMENTO'))).toHaveLength(21);
    expect(types[0]).toMatchObject({ nome: 'Acompanhamento ambiental', ativo: true, codigo: 'ATD-01' });

    const available = getAvailableActionsForTypes({
      tipos: types,
      acoes: actions,
      links: [],
      selectedTypeNames: ['Acompanhamento ambiental'],
    });
    expect(available.map((item) => item.nome)).toEqual([
      'Inspecionar ou verificar condição',
      'Coletar evidências ou realizar registro fotográfico',
      'Registrar constatação, pendência ou demanda',
      'Monitorar e revisar controles',
      'Analisar situação ou documentação',
      'Levantar dados em campo',
      'Orientar cliente, técnico ou equipe',
      'Apresentar resultado ou fornecer feedback',
    ]);
  });
});
