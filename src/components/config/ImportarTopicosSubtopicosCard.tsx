import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQueryClient } from '@tanstack/react-query';
import {
  parseTopicosSubtopicosFromXlsx,
  aplicarTopicosSubtopicos,
  type ParsedTopicosSubtopicos,
} from '@/lib/importarTopicosSubtopicos';

export function ImportarTopicosSubtopicosCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [parsed, setParsed] = useState<ParsedTopicosSubtopicos | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const qc = useQueryClient();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setParsing(true);
    try {
      const result = await parseTopicosSubtopicosFromXlsx(file);
      if (result.topicos.length === 0 && result.subtopicos.length === 0) {
        toast.error('Nenhum tópico ou subtópico encontrado na planilha');
        return;
      }
      setParsed(result);
      setConfirmOpen(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao ler planilha');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setApplying(true);
    try {
      await aplicarTopicosSubtopicos(parsed);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['topicos'] }),
        qc.invalidateQueries({ queryKey: ['subtopicos'] }),
        qc.invalidateQueries({ queryKey: ['tipos_atendimento_config'] }),
        qc.invalidateQueries({ queryKey: ['acoes_especificas_config'] }),
        qc.invalidateQueries({ queryKey: ['demandas_especificas'] }),
      ]);
      toast.success(`Importação concluída: ${parsed.topicos.length} tópicos e ${parsed.subtopicos.length} subtópicos`);
      setConfirmOpen(false);
      setParsed(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao aplicar importação');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Importar tópicos e subtópicos da planilha modelo</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lê a aba <strong>Planilha2</strong> e substitui todos os tópicos e subtópicos atuais. Outras configurações não são afetadas.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={parsing}
            className="gap-1 shrink-0"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !applying && setConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir tópicos e subtópicos?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Serão importados <strong>{parsed?.topicos.length ?? 0} tópicos</strong> e{' '}
                  <strong>{parsed?.subtopicos.length ?? 0} subtópicos</strong> da planilha.
                </p>
                <p className="text-destructive">
                  Todos os tópicos e subtópicos atuais serão removidos e substituídos. Vínculos existentes em tipos, ações e demandas serão desvinculados.
                </p>
                <p className="text-xs text-muted-foreground">
                  Os subtópicos serão agrupados sob um tópico genérico chamado "(Importado)" — você pode reorganizá-los manualmente depois.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirm(); }} disabled={applying}>
              {applying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar e substituir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
