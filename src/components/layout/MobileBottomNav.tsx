import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  Play, 
  MoreHorizontal,
  Users,
  UserCog,
  Settings,
  ChartNoAxesCombined,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const mainNavItems = [
  { path: '/desktop', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/desktop/historico', label: 'Histórico', icon: History },
  { path: '/desktop/iniciar-visita', label: 'Visita', icon: Play, primary: true },
  { path: '/desktop/clientes', label: 'Clientes', icon: Users },
];

const moreNavItems = [
  { path: '/desktop/responsaveis', label: 'Responsáveis', icon: UserCog },
  { path: '/desktop/configuracoes', label: 'Configurações', icon: Settings },
  { path: '/desktop/gestao', label: 'Gestão', icon: ChartNoAxesCombined },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetAtendimento } = useAtendimento();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/desktop') return location.pathname === '/desktop';
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string, primary?: boolean) => {
    if (primary) {
      resetAtendimento();
    }
    navigate(path);
  };

  // Don't show bottom nav on visit flow pages
  if (location.pathname.startsWith('/visita/') || location.pathname === '/sucesso') {
    return null;
  }

  return (
    <>
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card border-t border-border",
        "safe-bottom"
      )}>
        <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto">
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path, item.primary)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-0.5",
                  "transition-colors touch-manipulation",
                  "min-w-[64px]",
                  item.primary && "relative",
                  active 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
                aria-label={item.label}
              >
                {item.primary ? (
                  <div className={cn(
                    "flex items-center justify-center",
                    "w-11 h-11 -mt-4 rounded-full",
                    "bg-primary text-primary-foreground",
                    "shadow-lg shadow-primary/30"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                ) : (
                  <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                )}
                <span className={cn(
                  "text-[10px] leading-tight",
                  item.primary && "-mt-0.5",
                  active ? "font-semibold" : "font-medium"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 gap-0.5",
              "transition-colors touch-manipulation",
              "min-w-[64px]",
              moreNavItems.some(i => isActive(i.path))
                ? "text-primary" 
                : "text-muted-foreground"
            )}
            aria-label="Mais opções"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] leading-tight font-medium">Mais</span>
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetTitle className="sr-only">Mais opções</SheetTitle>
          <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-6" />
          <div className="grid grid-cols-2 gap-3">
            {moreNavItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMoreOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl transition-colors",
                    "touch-safe",
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
