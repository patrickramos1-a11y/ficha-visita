export type ServiceTypeConfig = {
  id: string;
  nome: string;
  codigo?: string | null;
  finalidade?: string | null;
};

export type ServiceActionConfig = {
  id: string;
  nome: string;
  codigo?: string | null;
};

export type ServiceTypeActionLink = {
  tipo_id: string;
  acao_id: string;
  principal?: boolean | null;
  prioridade?: number | null;
  ativo?: boolean | null;
};

export type AvailableServiceAction<T extends ServiceActionConfig = ServiceActionConfig> = T & {
  relationLabel?: 'Principal' | 'Complementar';
  relationPriority?: number;
};

export type VisitServiceNarrative = {
  tipo: string;
  acoes: string[];
  texto: string;
};

export const TYPE_PURPOSES: Record<string, string> = {
  'Acompanhamento ambiental': 'verificar as condições ambientais, as obrigações aplicáveis e as rotinas de controle do empreendimento',
  'Avaliação técnica de sistemas de tratamento': 'avaliar a operação, a conservação e as necessidades de ajuste dos sistemas de tratamento',
  'Tomada de ciência': 'compreender a situação apresentada e identificar os encaminhamentos iniciais',
  'Consultoria ambiental': 'orientar o cliente sobre questões ambientais, operacionais ou de regularização',
  'Reunião de alinhamento técnico': 'alinhar responsabilidades, decisões e próximos passos entre os envolvidos',
  Planejamento: 'estruturar soluções, prioridades e etapas para as demandas identificadas',
  'Implementação de melhoria': 'executar ou acompanhar correções, adequações e melhorias ambientais ou operacionais',
  'Licenciamento ambiental': 'acompanhar a regularização, as exigências e os processos de licenciamento aplicáveis',
  'Fiscalização ambiental': 'acompanhar fiscalizações e orientar as providências relacionadas a notificações, intimações ou autos',
  'Treinamento ambiental': 'capacitar a equipe quanto aos procedimentos e às responsabilidades ambientais',
  'Levantamento técnico': 'produzir informações para subsidiar projetos, estudos, diagnósticos ou regularizações',
  'Monitoramento ambiental': 'acompanhar indicadores, registros, condicionantes e controles ambientais',
};

export const CANONICAL_ACTIONS: Record<string, string> = {
  'ACA-01': 'Alinhar tecnicamente',
  'ACA-02': 'Analisar situação ou documentação',
  'ACA-03': 'Definir plano de ação ou próximos passos',
  'ACA-04': 'Levantar dados em campo',
  'ACA-05': 'Realizar diagnóstico',
  'ACA-06': 'Inspecionar ou verificar condição',
  'ACA-07': 'Coletar evidências ou realizar registro fotográfico',
  'ACA-08': 'Registrar constatação, pendência ou demanda',
  'ACA-09': 'Orientar cliente, técnico ou equipe',
  'ACA-10': 'Acompanhar execução de obra',
  'ACA-11': 'Acompanhar vistoria ou fiscalização',
  'ACA-12': 'Consultar órgão ou andamento de processo',
  'ACA-13': 'Protocolar ou abrir processo',
  'ACA-14': 'Responder notificação, intimação ou exigência',
  'ACA-15': 'Negociar encaminhamento ou acordo',
  'ACA-16': 'Cadastrar ou regularizar',
  'ACA-17': 'Obter ou retirar licença e documento',
  'ACA-18': 'Monitorar e revisar controles',
  'ACA-19': 'Treinar equipe',
  'ACA-20': 'Executar limpeza, instalação, correção ou adequação',
  'ACA-21': 'Apresentar resultado ou fornecer feedback',
};

const TYPE_PRIMARY_ACTION_CODES: Record<string, string[]> = {
  'Acompanhamento ambiental': ['ACA-06', 'ACA-07', 'ACA-08', 'ACA-18'],
  'Avaliação técnica de sistemas de tratamento': ['ACA-05', 'ACA-06', 'ACA-18'],
  'Tomada de ciência': ['ACA-02', 'ACA-04', 'ACA-08'],
  'Consultoria ambiental': ['ACA-02', 'ACA-09', 'ACA-21'],
  'Reunião de alinhamento técnico': ['ACA-01', 'ACA-03', 'ACA-21'],
  Planejamento: ['ACA-03', 'ACA-05'],
  'Implementação de melhoria': ['ACA-10', 'ACA-20'],
  'Licenciamento ambiental': ['ACA-12', 'ACA-13', 'ACA-16', 'ACA-17'],
  'Fiscalização ambiental': ['ACA-11', 'ACA-14'],
  'Treinamento ambiental': ['ACA-19'],
  'Levantamento técnico': ['ACA-04', 'ACA-07'],
  'Monitoramento ambiental': ['ACA-18'],
};

export const TYPE_ACTION_CODES: Record<string, string[]> = {
  'Acompanhamento ambiental': ['ACA-06', 'ACA-07', 'ACA-08', 'ACA-18', 'ACA-02', 'ACA-04', 'ACA-09', 'ACA-21'],
  'Avaliação técnica de sistemas de tratamento': ['ACA-05', 'ACA-06', 'ACA-18', 'ACA-02', 'ACA-04', 'ACA-07', 'ACA-08', 'ACA-09'],
  'Tomada de ciência': ['ACA-02', 'ACA-04', 'ACA-08', 'ACA-03', 'ACA-05', 'ACA-06', 'ACA-07', 'ACA-09'],
  'Consultoria ambiental': ['ACA-02', 'ACA-09', 'ACA-21', 'ACA-01', 'ACA-03', 'ACA-05', 'ACA-15'],
  'Reunião de alinhamento técnico': ['ACA-01', 'ACA-03', 'ACA-21', 'ACA-02', 'ACA-09', 'ACA-15'],
  Planejamento: ['ACA-03', 'ACA-05', 'ACA-02', 'ACA-04', 'ACA-09', 'ACA-15'],
  'Implementação de melhoria': ['ACA-10', 'ACA-20', 'ACA-03', 'ACA-06', 'ACA-07', 'ACA-08', 'ACA-09'],
  'Licenciamento ambiental': ['ACA-12', 'ACA-13', 'ACA-16', 'ACA-17', 'ACA-02', 'ACA-03', 'ACA-04', 'ACA-07', 'ACA-08', 'ACA-09', 'ACA-11', 'ACA-14', 'ACA-15', 'ACA-18'],
  'Fiscalização ambiental': ['ACA-11', 'ACA-14', 'ACA-02', 'ACA-03', 'ACA-04', 'ACA-07', 'ACA-08', 'ACA-09', 'ACA-12', 'ACA-13', 'ACA-15', 'ACA-21'],
  'Treinamento ambiental': ['ACA-19', 'ACA-01', 'ACA-09', 'ACA-21'],
  'Levantamento técnico': ['ACA-04', 'ACA-07', 'ACA-02', 'ACA-05', 'ACA-06', 'ACA-08'],
  'Monitoramento ambiental': ['ACA-18', 'ACA-02', 'ACA-04', 'ACA-06', 'ACA-07', 'ACA-08', 'ACA-09', 'ACA-21'],
};

const CANONICAL_TYPE_DEFINITIONS = [
  { codigo: 'ATD-01', nome: 'Acompanhamento ambiental', survivor: 'Acompanhamento Ambiental', aliases: ['Acompanhamento Ambiental', 'Acompanhamento operacional', 'Auditoria ambiental', 'Gestão de resíduos', 'Gestão de água e outorga'] },
  { codigo: 'ATD-02', nome: 'Avaliação técnica de sistemas de tratamento', survivor: 'ETE / ETA', aliases: ['ETE / ETA', 'Gestão de efluentes'] },
  { codigo: 'ATD-03', nome: 'Tomada de ciência', survivor: 'Tomada de Ciência', aliases: ['Tomada de Ciência', 'Diagnóstico ambiental'] },
  { codigo: 'ATD-04', nome: 'Consultoria ambiental', survivor: 'Consultoria Ambiental', aliases: ['Consultoria Ambiental', 'Análise documental', 'Encerramento de demanda'] },
  { codigo: 'ATD-05', nome: 'Reunião de alinhamento técnico', survivor: 'Reunião de Alinhamento', aliases: ['Reunião de Alinhamento', 'Reunião técnica'] },
  { codigo: 'ATD-06', nome: 'Planejamento', survivor: 'Planejamento de Ação', aliases: ['Planejamento de Ação', 'Planejamento de adequações'] },
  { codigo: 'ATD-07', nome: 'Implementação de melhoria', survivor: 'Implementação de Melhoria', aliases: ['Implementação de Melhoria', 'Implantação de melhoria'] },
  { codigo: 'ATD-08', nome: 'Licenciamento ambiental', survivor: 'Licenciamento ambiental', aliases: ['Licenciamento Ambiental', 'Licenciamento ambiental', 'Regularização ambiental', 'Órgão Ambiental'] },
  { codigo: 'ATD-09', nome: 'Fiscalização ambiental', survivor: 'Fiscalização Ambiental', aliases: ['Fiscalização Ambiental', 'Fiscalização ou órgão ambiental', 'Atendimento a notificação'] },
  { codigo: 'ATD-10', nome: 'Treinamento ambiental', survivor: 'Treinamento ambiental', aliases: ['Treinamento Ambiental', 'Treinamento ambiental'] },
  { codigo: 'ATD-11', nome: 'Levantamento técnico', survivor: 'Levantamento de campo', aliases: ['Levantamento de campo', 'Relatórios técnicos'] },
  { codigo: 'ATD-12', nome: 'Monitoramento ambiental', survivor: 'Monitoramento ambiental', aliases: ['Monitoramento ambiental', 'Condicionantes ambientais'] },
] as const;

const CANONICAL_ACTION_DEFINITIONS = [
  ['ACA-01', 'Alinhar tecnicamente', 'Reunir com cliente'],
  ['ACA-02', 'Analisar situação ou documentação', 'Analisar documentação'],
  ['ACA-03', 'Definir plano de ação ou próximos passos', 'Definir próximos passos'],
  ['ACA-04', 'Levantar dados em campo', 'Levantar informações em campo'],
  ['ACA-05', 'Realizar diagnóstico', 'Realizar diagnóstico'],
  ['ACA-06', 'Inspecionar ou verificar condição', 'Revisar situação ambiental'],
  ['ACA-07', 'Coletar evidências ou realizar registro fotográfico', 'Coletar evidências'],
  ['ACA-08', 'Registrar constatação, pendência ou demanda', 'Registrar pendências'],
  ['ACA-09', 'Orientar cliente, técnico ou equipe', 'Orientar cliente ou equipe'],
  ['ACA-10', 'Acompanhar execução de obra', 'Acompanhar obra da ETE'],
  ['ACA-11', 'Acompanhar vistoria ou fiscalização', 'Agendar vistoria'],
  ['ACA-12', 'Consultar órgão ou andamento de processo', 'Consultar andamento do processo'],
  ['ACA-13', 'Protocolar ou abrir processo', 'Protocolar documento'],
  ['ACA-14', 'Responder notificação, intimação ou exigência', 'Esclarecer exigência técnica'],
  ['ACA-15', 'Negociar encaminhamento ou acordo', 'Solicitar prioridade ou análise'],
  ['ACA-16', 'Cadastrar ou regularizar', 'Complementar documentação'],
  ['ACA-17', 'Obter ou retirar licença e documento', 'Retirar licença ou documento'],
  ['ACA-18', 'Monitorar e revisar controles', 'Atualizar status de demanda'],
  ['ACA-19', 'Treinar equipe', 'Repassar orientação em campo'],
  ['ACA-20', 'Executar limpeza, instalação, correção ou adequação', 'Indicar correção em campo'],
  ['ACA-21', 'Apresentar resultado ou fornecer feedback', 'Reunir com responsável técnico'],
] as const;

const TYPE_NAME_ALIASES = new Map(CANONICAL_TYPE_DEFINITIONS.flatMap((item) => [...item.aliases, item.nome].map((alias) => [normalize(alias), item.nome] as const)));
const ACTION_NAME_ALIASES = new Map([
  ...CANONICAL_ACTION_DEFINITIONS.flatMap(([codigo, nome, survivor]) => [[normalize(nome), nome], [normalize(survivor), nome]] as const),
  [normalize('Conferir operação do sistema'), CANONICAL_ACTIONS['ACA-06']],
  [normalize('Elaborar encaminhamento técnico'), CANONICAL_ACTIONS['ACA-03']],
  [normalize('Registrar demandas'), CANONICAL_ACTIONS['ACA-08']],
  [normalize('Validar correção'), CANONICAL_ACTIONS['ACA-06']],
]);

type CatalogConfig = {
  id: string;
  nome: string;
  ativo?: boolean;
  naturezas?: string[];
  codigo?: string | null;
  descricao?: string | null;
};

export function canonicalizeTypeName(name: string) {
  return TYPE_NAME_ALIASES.get(normalize(name)) ?? name;
}

export function canonicalizeActionName(name: string) {
  return ACTION_NAME_ALIASES.get(normalize(name)) ?? name;
}

function preserveSpecializedCatalog<T extends CatalogConfig>(items: T[], consumedIds: Set<string>) {
  return items.flatMap((item) => {
    if (consumedIds.has(item.id)) return [];
    const naturezas = item.naturezas ?? ['ATENDIMENTO'];
    if (!naturezas.includes('ATENDIMENTO')) return [item];
    const specialized = naturezas.filter((natureza) => natureza !== 'ATENDIMENTO');
    return specialized.length ? [{ ...item, naturezas: specialized }] : [];
  });
}

export function canonicalizeTypeConfigs<T extends CatalogConfig>(items: T[]): T[] {
  const consumedIds = new Set<string>();
  const canonical = CANONICAL_TYPE_DEFINITIONS.flatMap((definition) => {
    const survivor = items.find((item) => item.nome === definition.survivor)
      ?? items.find((item) => canonicalizeTypeName(item.nome) === definition.nome);
    if (!survivor) return [];
    consumedIds.add(survivor.id);
    return [{
      ...survivor,
      nome: definition.nome,
      codigo: definition.codigo,
      finalidade: TYPE_PURPOSES[definition.nome],
      ativo: true,
      naturezas: Array.from(new Set([...(survivor.naturezas ?? []), 'ATENDIMENTO'])),
    } as T];
  });
  return [...canonical, ...preserveSpecializedCatalog(items, consumedIds)];
}

export function canonicalizeActionConfigs<T extends CatalogConfig>(items: T[]): T[] {
  const consumedIds = new Set<string>();
  const canonical = CANONICAL_ACTION_DEFINITIONS.flatMap(([codigo, nome, survivorName]) => {
    const survivor = items.find((item) => item.nome === survivorName)
      ?? items.find((item) => canonicalizeActionName(item.nome) === nome);
    if (!survivor) return [];
    consumedIds.add(survivor.id);
    return [{
      ...survivor,
      nome,
      codigo,
      ativo: true,
      naturezas: Array.from(new Set([...(survivor.naturezas ?? []), 'ATENDIMENTO'])),
    } as T];
  });
  return [...canonical, ...preserveSpecializedCatalog(items, consumedIds)];
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR');
}

function joinNatural(values: string[]) {
  if (values.length < 2) return values[0] ?? '';
  if (values.length === 2) return `${values[0]} e ${values[1]}`;
  return `${values.slice(0, -1).join(', ')} e ${values.at(-1)}`;
}

function formatVisitDate(value?: string | Date | null) {
  if (!value) return 'data não informada';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'data não informada';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function actionSummary(actions: string[]) {
  if (actions.length > 5) return `${actions.length} ações técnicas relacionadas ao escopo da visita`;
  return joinNatural(actions.map((action) => action.charAt(0).toLocaleLowerCase('pt-BR') + action.slice(1)));
}

export function getAvailableActionsForTypes<T extends ServiceActionConfig>({
  tipos,
  acoes,
  links,
  selectedTypeNames,
}: {
  tipos: ServiceTypeConfig[];
  acoes: T[];
  links: ServiceTypeActionLink[];
  selectedTypeNames: string[];
}): AvailableServiceAction<T>[] {
  const activeLinks = links.filter((link) => link.ativo !== false);
  if (selectedTypeNames.length === 0) return [];

  if (activeLinks.length === 0) {
    const selectedCanonicalTypes = Array.from(new Set(selectedTypeNames.map(canonicalizeTypeName)));
    const allowedCodes = new Set(selectedCanonicalTypes.flatMap((typeName) => TYPE_ACTION_CODES[typeName] ?? []));
    const primaryCodes = new Set(selectedCanonicalTypes.flatMap((typeName) => TYPE_PRIMARY_ACTION_CODES[typeName] ?? []));
    if (allowedCodes.size === 0) return acoes;
    return acoes
      .filter((acao) => acao.codigo && allowedCodes.has(acao.codigo))
      .map((acao) => ({
        ...acao,
        relationLabel: primaryCodes.has(acao.codigo!) ? 'Principal' as const : 'Complementar' as const,
        relationPriority: TYPE_ACTION_CODES[selectedCanonicalTypes[0]]?.indexOf(acao.codigo!) ?? 100,
      }))
      .sort((a, b) => Number(b.relationLabel === 'Principal') - Number(a.relationLabel === 'Principal') || (a.relationPriority ?? 100) - (b.relationPriority ?? 100));
  }

  const selected = new Set(selectedTypeNames.map(normalize));
  const selectedTypeIds = new Set(tipos.filter((tipo) => selected.has(normalize(tipo.nome))).map((tipo) => tipo.id));
  const relationByAction = new Map<string, { principal: boolean; prioridade: number }>();

  for (const link of activeLinks) {
    if (!selectedTypeIds.has(link.tipo_id)) continue;
    const next = { principal: link.principal === true, prioridade: link.prioridade ?? 100 };
    const current = relationByAction.get(link.acao_id);
    if (!current || Number(next.principal) > Number(current.principal) || (next.principal === current.principal && next.prioridade < current.prioridade)) {
      relationByAction.set(link.acao_id, next);
    }
  }

  return acoes
    .filter((acao) => relationByAction.has(acao.id))
    .map((acao) => {
      const relation = relationByAction.get(acao.id)!;
      return {
        ...acao,
        relationLabel: relation.principal ? 'Principal' as const : 'Complementar' as const,
        relationPriority: relation.prioridade,
      };
    })
    .sort((a, b) => Number(b.relationLabel === 'Principal') - Number(a.relationLabel === 'Principal') || (a.relationPriority ?? 100) - (b.relationPriority ?? 100) || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function buildVisitServiceNarratives({
  date,
  responsible,
  clients = [],
  selectedTypes = [],
  selectedActions = [],
  typeConfigs = [],
  actionConfigs = [],
  links = [],
}: {
  date?: string | Date | null;
  responsible?: string | null;
  clients?: string[];
  selectedTypes?: string[];
  selectedActions?: string[];
  typeConfigs?: ServiceTypeConfig[];
  actionConfigs?: ServiceActionConfig[];
  links?: ServiceTypeActionLink[];
}): VisitServiceNarrative[] {
  const uniqueTypes = Array.from(new Set(selectedTypes.map((value) => canonicalizeTypeName(value.trim())).filter(Boolean)));
  const uniqueActions = Array.from(new Set(selectedActions.map((value) => canonicalizeActionName(value.trim())).filter(Boolean)));
  if (uniqueTypes.length === 0 && uniqueActions.length === 0) return [];

  const typeByName = new Map(typeConfigs.map((item) => [normalize(item.nome), item]));
  const actionByName = new Map(actionConfigs.map((item) => [normalize(item.nome), item]));
  const linksByType = new Map<string, ServiceTypeActionLink[]>();
  for (const link of links.filter((item) => item.ativo !== false)) {
    linksByType.set(link.tipo_id, [...(linksByType.get(link.tipo_id) ?? []), link]);
  }

  const assigned = new Set<string>();
  const ownerByAction = new Map<string, string>();
  for (const actionName of uniqueActions) {
    const actionConfig = actionByName.get(normalize(actionName));
    let bestType = '';
    let bestScore = Number.POSITIVE_INFINITY;

    for (const typeName of uniqueTypes) {
      const typeConfig = typeByName.get(normalize(typeName));
      const persistedLink = typeConfig && actionConfig
        ? (linksByType.get(typeConfig.id) ?? []).find((link) => link.acao_id === actionConfig.id)
        : undefined;
      const staticIndex = (TYPE_ACTION_CODES[typeName] ?? [])
        .map((code) => CANONICAL_ACTIONS[code])
        .findIndex((name) => normalize(name) === normalize(actionName));
      const score = persistedLink
        ? (persistedLink.principal ? 0 : 1_000) + (persistedLink.prioridade ?? 100)
        : staticIndex >= 0 ? 2_000 + staticIndex : Number.POSITIVE_INFINITY;

      if (score < bestScore) {
        bestScore = score;
        bestType = typeName;
      }
    }

    if (bestType) ownerByAction.set(normalize(actionName), bestType);
  }

  const visitDate = formatVisitDate(date);
  const executor = responsible?.trim() || 'responsável técnico não informado';
  const clientText = clients.filter(Boolean).length ? ` para ${joinNatural(clients.filter(Boolean))}` : '';
  const narratives: VisitServiceNarrative[] = [];
  const hasMappedType = uniqueTypes.some((typeName) => {
    const config = typeByName.get(normalize(typeName));
    return Boolean(TYPE_ACTION_CODES[typeName]?.length || (config && (linksByType.get(config.id) ?? []).length));
  });

  if (!hasMappedType && uniqueActions.length > 0) {
    const typeName = uniqueTypes[0] || 'Serviços executados';
    return [{
      tipo: typeName,
      acoes: uniqueActions,
      texto: `Na visita realizada em ${visitDate}, ${executor} realizou ${typeName.toLocaleLowerCase('pt-BR')}${clientText}, contemplando ${actionSummary(uniqueActions)}.`,
    }];
  }

  for (const typeName of uniqueTypes) {
    const config = typeByName.get(normalize(typeName));
    const actions = uniqueActions.filter((action) => ownerByAction.get(normalize(action)) === typeName);
    actions.forEach((action) => assigned.add(normalize(action)));
    const purpose = config?.finalidade?.trim() || TYPE_PURPOSES[typeName];
    const actionText = actions.length ? `, contemplando ${actionSummary(actions)}` : '';
    const purposeText = purpose ? ` A atividade teve como finalidade ${purpose}.` : '';
    narratives.push({
      tipo: typeName,
      acoes: actions,
      texto: `Na visita realizada em ${visitDate}, ${executor} realizou o atendimento de ${typeName.toLocaleLowerCase('pt-BR')}${clientText}${actionText}.${purposeText}`,
    });
  }

  const unassigned = uniqueActions.filter((action) => !assigned.has(normalize(action)));
  if (unassigned.length) {
    narratives.push({
      tipo: uniqueTypes.length ? 'Atividades complementares' : 'Serviços executados',
      acoes: unassigned,
      texto: `Na visita realizada em ${visitDate}, ${executor}${clientText} executou ${actionSummary(unassigned)}.`,
    });
  }

  return narratives;
}

