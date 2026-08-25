import { useState } from 'react';
import { Bot, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ResumoRelatorioEditorProps = {
  visit: Record<string, any>;
  clientes?: string[];
  responsavel?: string | null;
  demandas?: Array<{ descricao?: string | null }>;
  comentarios?: Array<{ texto?: string | null }>;
  dadosModalidade?: unknown;
  initialComentario?: string | null;
  initialResumo?: string | null;
  onSave: (values: {
    comentario_base_relatorio: string;
    resumo_relatorio: string;
    resumo_relatorio_gerado_em?: string;
  }) => Promise<void> | void;
};

export function ResumoRelatorioEditor({
  visit,
  clientes = [],
  responsavel,
  demandas = [],
  comentarios = [],
  dadosModalidade,
  initialComentario,
  initialResumo,
  onSave,
}: ResumoRelatorioEditorProps) {
  const [comentario, setComentario] = useState(initialComentario ?? '');
  const [resumo, setResumo] = useState(initialResumo ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const buildPayload = () => ({
    titulo: visit.titulo,
    modo: visit.modo,
    natureza: visit.natureza,
    clientes,
    responsavel,
    data_inicio: visit.data_inicio ?? visit.created_at,
    data_fim: visit.data_fim,
    comentario_base_relatorio: comentario,
    tipos_atendimento: visit.tipos_atendimento ?? [],
    acoes_especificas: visit.acoes_especificas ?? [],
    demandas,
    comentarios,
    dados_modalidade: dadosModalidade ?? visit.dados_modalidade,
  });

  const generate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/gerar-resumo-visita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit: buildPayload() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Nao foi possivel gerar o resumo.');
      setResumo(result.resumo || '');
      toast.success('Resumo tecnico gerado');
    } catch (error: any) {
      toast.error(error?.message || 'Falha ao gerar resumo');
    } finally {
      setIsGenerating(false);
    }
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await onSave({
        comentario_base_relatorio: comentario,
        resumo_relatorio: resumo,
        resumo_relatorio_gerado_em: resumo ? new Date().toISOString() : undefined,
      });
      toast.success('Resumo do relatorio salvo');
    } catch (error: any) {
      toast.error(error?.message || 'Falha ao salvar resumo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4 text-primary" />
          Resumo do relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Comentário base do consultor</Label>
          <Textarea
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            placeholder="Escreva livremente o que aconteceu na visita. A IA organiza o texto sem inventar informações."
            className="min-h-28 resize-y"
          />
        </div>
        <div className="space-y-2">
          <Label>Resumo técnico para o relatório</Label>
          <Textarea
            value={resumo}
            onChange={(event) => setResumo(event.target.value)}
            placeholder="Gere com IA ou escreva/edite o resumo técnico manualmente."
            className="min-h-36 resize-y"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={generate} disabled={isGenerating} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isGenerating ? 'Gerando...' : 'Gerar resumo com IA'}
          </Button>
          <Button type="button" onClick={save} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar resumo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

