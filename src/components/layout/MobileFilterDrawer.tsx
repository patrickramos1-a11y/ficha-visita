import { ReactNode } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

interface MobileFilterDrawerProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount?: number;
}

export function MobileFilterDrawer({ children, open, onOpenChange, activeCount = 0 }: MobileFilterDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shrink-0 touch-safe">
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">Filtros</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 pb-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
