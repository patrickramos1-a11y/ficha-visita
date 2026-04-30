import { ReactNode, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  Users, 
  UserCog, 
  Play, 
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import logoHorizontal from '@/assets/logo-horizontal.png';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from './MobileBottomNav';

interface DesktopLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/desktop', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/desktop/historico', label: 'Histórico', icon: History },
  { path: '/desktop/clientes', label: 'Clientes', icon: Users },
  { path: '/desktop/responsaveis', label: 'Responsáveis', icon: UserCog },
  { path: '/desktop/configuracoes', label: 'Configurações', icon: Settings },
];

function SidebarContent({ 
  collapsed, 
  onStartVisit 
}: { 
  collapsed: boolean;
  onStartVisit: () => void;
}) {
  const location = useLocation();
  
  return (
    <>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/desktop' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Button 
          onClick={onStartVisit}
          className={cn(
            "w-full gap-2",
            collapsed ? "px-2" : ""
          )}
        >
          <Play className="h-4 w-4" />
          {!collapsed && "Iniciar Visita"}
        </Button>
      </div>
    </>
  );
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { resetAtendimento } = useAtendimento();
  const isMobile = useIsMobile();

  const handleStartVisit = () => {
    resetAtendimento();
    navigate('/desktop/iniciar-visita');
  };

  // Get current page title
  const getPageTitle = () => {
    if (location.pathname.startsWith('/desktop/atendimento')) return 'Detalhes';
    
    const currentItem = navItems.find(item => 
      item.path !== '/desktop' && location.pathname.startsWith(item.path)
    ) || navItems.find(item => item.path === location.pathname);
    
    return currentItem?.label || 'Dashboard';
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-14">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-card border-b border-border flex items-center justify-center px-4 h-12 safe-top">
          <img 
            src={logoHorizontal} 
            alt="Ramos Engenharia" 
            className="h-7 object-contain"
          />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-3 py-3">
          {children}
        </main>

        {/* Bottom Navigation */}
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-row">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "bg-card border-r border-border flex flex-col transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-16 border-b border-border flex items-center justify-between px-4">
          {!collapsed && (
            <img 
              src={logoHorizontal} 
              alt="Ramos Engenharia" 
              className="h-8 object-contain"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <SidebarContent 
          collapsed={collapsed}
          onStartVisit={handleStartVisit}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center px-6 shrink-0">
          <h1 className="text-xl font-semibold text-foreground">
            {getPageTitle()}
          </h1>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
