import { useState } from 'react';
import { MessageSquare, Plus, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import type { Demanda, DemandaStatus } from '@/types/atendimento';

export function RadarVisita() {
  const { data, addDemanda, updateDemanda, removeDemanda, addAnotacao, updateAnotacao, removeAnotacao } = useAtendimento();
  const [newDemanda, setNewDemanda] = useState('');
  const [newComentario, setNewComentario] = useState('');

  const demandasValidas = data.demandas
    .map((demanda, index) => ({ demanda, index }))
    .filter(({ demanda }) => demanda.descricao.trim());
  const comentariosValidos = (data.anotacoes_itens ?? []).filter((item) => item.texto.trim());

  const handleAddDemanda = () => {
    const descricao = newDemanda.trim();
    if (!descricao) return;
    const demanda: Demanda = {
      id: crypto.randomUUID(),
      descricao,
      personalizada: true,
      status: 'EM_EXECUCAO',
    };
    addDemanda(demanda);
    setNewDemanda('');
  };

  const handleAddComentario = () => {
    const texto = newComentario.trim();
    if (!texto) return;
    addAnotacao(texto);
    setNewComentario('');
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Send className="h-4 w-4 text-primary" />
            Demandas para o Radar Vital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newDemanda}
              onChange={(event) => setNewDemanda(event.target.value)}
              placeholder="Nova demanda para o Radar"
              onKeyDown={(event) => { if (event.key === 'Enter') handleAddDemanda(); }}
            />
            <Button type="button" size="icon" onClick={handleAddDemanda}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {demandasValidas.map(({ demanda, index }) => (
              <div key={demanda.id ?? index} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Select
                    value={demanda.status || 'EM_EXECUCAO'}
                    onValueChange={(value) => updateDemanda(index, { ...demanda, status: value as DemandaStatus })}
                  >
                    <SelectTrigger className="h-9 w-[145px] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EM_EXECUCAO">Em execução</SelectItem>
                      <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                      <SelectItem value="NAO_FEITO">Não feito</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDemanda(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={demanda.descricao}
                  onChange={(event) => updateDemanda(index, { ...demanda, descricao: event.target.value })}
                  placeholder="Descreva a demanda..."
                  className="min-h-20 resize-none text-sm"
                />
              </div>
            ))}
            {demandasValidas.length === 0 && (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Nenhuma demanda para enviar ao Radar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            Comentários para o Radar Vital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={newComentario}
              onChange={(event) => setNewComentario(event.target.value)}
              placeholder="Novo comentário da visita"
              className="min-h-20 resize-none"
            />
            <Button type="button" size="icon" onClick={handleAddComentario}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {comentariosValidos.map((item) => (
              <div key={item.id} className="flex gap-2 rounded-md border p-2">
                <Textarea
                  value={item.texto}
                  onChange={(event) => updateAnotacao(item.id, event.target.value)}
                  className="min-h-16 resize-none text-sm"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeAnotacao(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {comentariosValidos.length === 0 && (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Nenhum comentário registrado para o Radar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
