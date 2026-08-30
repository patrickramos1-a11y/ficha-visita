import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, Database, HardDrive, ImageIcon, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { calculatePhotoStorageStats, formatBytes } from '@/lib/photoStorageStats';

const db = supabase as any;

const tipoLabel: Record<string, string> = {
  inicial: 'Inicial',
  durante: 'Durante',
  final: 'Final',
};

export function PhotoStorageStatsCard() {
  const { data: fotos = [], isLoading } = useQuery({
    queryKey: ['gestao-photo-storage-stats'],
    retry: false,
    queryFn: async () => {
      const { data, error } = await db
        .from('atendimento_fotos')
        .select('id,tipo,metadata_compressao')
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error && /metadata_compressao/i.test(String(error.message))) {
        const fallback = await db
          .from('atendimento_fotos')
          .select('id,tipo')
          .order('created_at', { ascending: false })
          .limit(5000);
        return fallback.error ? [] : (fallback.data ?? []);
      }
      if (error) return [];
      return data ?? [];
    },
  });

  const stats = useMemo(() => calculatePhotoStorageStats(fotos), [fotos]);
  const partial = stats.totalPhotos > stats.photosWithMetadata;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            Armazenamento de fotos
          </span>
          <Badge variant={partial ? 'outline' : 'secondary'}>
            {partial ? 'estimativa parcial' : 'metadados completos'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MiniMetric icon={ImageIcon} label="Fotos cadastradas" value={isLoading ? '...' : String(stats.totalPhotos)} />
          <MiniMetric icon={Database} label="Volume conhecido" value={formatBytes(stats.knownBytes)} />
          <MiniMetric icon={Camera} label="Média por foto" value={formatBytes(stats.averageBytes)} />
          <MiniMetric icon={HardDrive} label="Maior foto" value={formatBytes(stats.largestBytes)} />
          <MiniMetric icon={TrendingDown} label="Economia média" value={`${stats.averageSavingsPercent}%`} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Fotos por tipo</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([tipo, total]) => (
                <Badge key={tipo} variant="secondary">
                  {tipoLabel[tipo] ?? tipo}: {total}
                </Badge>
              ))}
              {Object.keys(stats.byType).length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhuma foto cadastrada.</span>
              )}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Projeção com a nova regra</p>
            <div className="flex flex-wrap gap-2">
              {stats.estimates.map((item) => (
                <Badge key={item.photos} variant="outline">
                  {item.photos.toLocaleString('pt-BR')} fotos: {formatBytes(item.bytes)}
                </Badge>
              ))}
            </div>
            {partial && (
              <p className="mt-2 text-xs text-muted-foreground">
                Fotos antigas sem metadados continuam visíveis e entram na contagem, mas não no volume estimado.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Camera;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
