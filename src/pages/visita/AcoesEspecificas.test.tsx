import type { PropsWithChildren, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AcoesEspecificas from './AcoesEspecificas';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setAcoesEspecificas: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/hooks/useVisitRoute', () => ({ useVisitRoute: vi.fn() }));
vi.mock('@/components/layout/MobileLayout', () => ({
  MobileLayout: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/visita/ProgressStepper', () => ({
  ProgressStepper: () => null,
  getVisitStepsForMode: () => [{ id: 'acoes', label: 'Ações', route: '/visita/acoes' }],
}));
vi.mock('@/components/mobile', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  EmptyState: ({ title }: { title: string }) => <p>{title}</p>,
  CountBadge: ({ count }: { count: number }) => <span>{count}</span>,
  MobileFooter: ({ children }: { children: ReactNode }) => <footer>{children}</footer>,
}));
vi.mock('@/contexts/AtendimentoContext', () => ({
  useAtendimento: () => ({
    data: {
      modo: 'personalizado',
      natureza: 'PERSONALIZADO',
      tipos_atendimento: ['Acompanhamento ambiental'],
      acoes_especificas: [],
      atendimento_personalizado: {
        tipos: [{ id: 'tipo-antigo', nome: 'Inspeção PCA', ativo: true }],
        acoes: [{ id: 'acao-antiga', nome: 'Verificar resíduos comuns', ativo: true }],
      },
    },
    setAcoesEspecificas: mocks.setAcoesEspecificas,
  }),
}));
vi.mock('@/hooks/useConfigEntities', () => ({
  useTiposAtendimentoConfig: () => ({
    data: [{ id: 'tipo-global', nome: 'Acompanhamento ambiental', ativo: true, naturezas: ['ATENDIMENTO'] }],
    isLoading: false,
  }),
  useAcoesEspecificasConfig: () => ({
    data: [
      { id: 'acao-vinculada', nome: 'Inspecionar ou verificar condição', ativo: true, naturezas: ['ATENDIMENTO'] },
      { id: 'acao-solta', nome: 'Treinar equipe', ativo: true, naturezas: ['ATENDIMENTO'] },
    ],
    isLoading: false,
  }),
  useTipoAtendimentoAcoes: () => ({
    data: [{ tipo_id: 'tipo-global', acao_id: 'acao-vinculada', principal: true, prioridade: 1, ativo: true }],
    isLoading: false,
  }),
}));

describe('Ações específicas da visita personalizada', () => {
  beforeEach(() => vi.clearAllMocks());

  it('usa o catálogo global e exibe somente ações vinculadas ao tipo selecionado', () => {
    render(<AcoesEspecificas />);

    expect(screen.getByText('Acompanhamento ambiental')).toBeInTheDocument();
    expect(screen.getByText('Inspecionar ou verificar condição')).toBeInTheDocument();
    expect(screen.queryByText('Treinar equipe')).not.toBeInTheDocument();
    expect(screen.queryByText('Verificar resíduos comuns')).not.toBeInTheDocument();
  });
});
