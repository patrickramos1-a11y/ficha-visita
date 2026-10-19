import { describe, expect, it } from 'vitest';
import { buildWorksConformityReport, normalizeConformityAnswer } from '@/lib/conformityReport';

describe('conformidade binária', () => {
  it('normaliza a resposta parcial histórica como não conforme', () => {
    expect(normalizeConformityAnswer('PARCIALMENTE')).toBe('NAO');
  });

  it('não atribui pontuação intermediária ao histórico parcial', () => {
    const report = buildWorksConformityReport({ houve_avanco: 'PARCIALMENTE' });

    expect(report.counts).not.toHaveProperty('parcial');
    expect(report.counts.naoConforme).toBe(1);
    expect(report.percentage).toBe(0);
    expect(report.alerts).toEqual([
      expect.objectContaining({ key: 'houve_avanco', severity: 'critical' }),
    ]);
  });
});
