import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, VISIT_STEPS } from '@/components/visita/ProgressStepper';
import { MobileFooter, EmptyState } from '@/components/mobile';
import { Camera, Plus, X, ChevronRight, FileText, CheckSquare, Image, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Anotacoes() {
  useVisitRoute('/visita/anotacoes');
  const navigate = useNavigate();
  const { data, setAnotacoes, addChecklistItem, toggleChecklistItem, removeChecklistItem, addFoto } = useAtendimento();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const [newCheckItem, setNewCheckItem] = useState('');
  const [activeTab, setActiveTab] = useState<'notas' | 'checklist' | 'fotos'>('notas');

  const handleAddCheckItem = () => {
    if (!newCheckItem.trim()) return;
    addChecklistItem(newCheckItem.trim());
    setNewCheckItem('');
  };

  const handleTirarFoto = () => {
    cameraInputRef.current?.click();
  };

  const handleEscolherGaleria = () => {
    galleryInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      addFoto(result, 'durante');
      toast.success('Foto adicionada!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleContinue = () => {
    navigate('/visita/tipos');
  };

  const duranteFotos = data.fotos.filter(f => f.tipo === 'durante');

  const tabs = [
    { id: 'notas' as const, label: 'Notas', icon: FileText, count: 0 },
    { id: 'checklist' as const, label: 'Checklist', icon: CheckSquare, count: data.checklist.length },
    { id: 'fotos' as const, label: 'Fotos', icon: Image, count: duranteFotos.length },
  ];

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/responsavel')} title="Anotações">
      <ProgressStepper steps={VISIT_STEPS} currentStep={2} />
      
      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors touch-safe",
              activeTab === tab.id 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden xs:inline">{tab.label}</span>
            {tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scroll-smooth-y p-4">
        {activeTab === 'notas' && (
          <div className="space-y-4">
            <Textarea
              placeholder="Digite suas anotações aqui..."
              value={data.anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              className="min-h-[250px] text-base resize-none"
            />
            <p className="text-xs text-muted-foreground">
              💡 Use o Checklist para itens que virarão sugestões de demandas
            </p>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              💡 Itens não marcados virarão sugestões de demandas "em execução"
            </p>
            
            {/* Add new item */}
            <div className="flex gap-2">
              <Input
                placeholder="Novo item do checklist..."
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCheckItem()}
                className="flex-1 h-12 text-base"
              />
              <Button 
                onClick={handleAddCheckItem} 
                size="icon" 
                disabled={!newCheckItem.trim()}
                className="h-12 w-12 touch-safe haptic-press"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              {data.checklist.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="Nenhum item no checklist"
                  description="Adicione itens usando o campo acima"
                />
              ) : (
                data.checklist.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border transition-colors",
                      item.marcado ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
                    )}
                  >
                    <Checkbox
                      checked={item.marcado}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      className="w-6 h-6"
                    />
                    <span className={cn(
                      "flex-1 text-base",
                      item.marcado && 'line-through text-muted-foreground'
                    )}>
                      {item.texto}
                    </span>
                    <button
                      onClick={() => removeChecklistItem(item.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 touch-safe"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'fotos' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleTirarFoto}
                variant="outline"
                className="h-16 border-dashed flex-col gap-2 haptic-press"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs">Tirar Foto</span>
              </Button>
              <Button
                onClick={handleEscolherGaleria}
                variant="outline"
                className="h-16 border-dashed flex-col gap-2 haptic-press"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs">Da Galeria</span>
              </Button>
            </div>

            {/* Photos grid */}
            {duranteFotos.length === 0 ? (
              <EmptyState
                icon={Image}
                title="Nenhuma foto adicionada"
                description="Registre o atendimento com fotos"
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {duranteFotos.map((foto, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    <img
                      src={foto.url}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <MobileFooter>
        <Button onClick={handleContinue} className="w-full h-14 text-lg haptic-press">
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </MobileFooter>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </MobileLayout>
  );
}
