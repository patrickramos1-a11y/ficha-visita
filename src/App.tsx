import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AtendimentoProvider, useAtendimento } from "@/contexts/AtendimentoContext";
import { SyncProvider } from "@/contexts/SyncContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";
import { ConfigCachePrefetcher } from "@/components/config/ConfigCachePrefetcher";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";

// Mobile pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FotoInicialOpcional from "./pages/visita/FotoInicialOpcional";
import SelecionarResponsavel from "./pages/visita/SelecionarResponsavel";
import Anotacoes from "./pages/visita/Anotacoes";
import TiposAtendimento from "./pages/visita/TiposAtendimento";
import AcoesEspecificas from "./pages/visita/AcoesEspecificas";
import SugestoesDemandas from "./pages/visita/SugestoesDemandas";
import SelecionarClientesFinal from "./pages/visita/SelecionarClientesFinal";
import FotoFinalObrigatoria from "./pages/visita/FotoFinalObrigatoria";
import ResumoAtendimento from "./pages/visita/ResumoAtendimento";
import Sucesso from "./pages/Sucesso";
import Historico from "./pages/Historico";
import TiposRapida from "./pages/visita/rapida/TiposRapida";
import ClientesRapida from "./pages/visita/rapida/ClientesRapida";
import ResponsavelRapida from "./pages/visita/rapida/ResponsavelRapida";
import FotosRapida from "./pages/visita/rapida/FotosRapida";

// Desktop pages
import Dashboard from "./pages/desktop/Dashboard";
import DesktopHistorico from "./pages/desktop/Historico";
import AtendimentoDetalhe from "./pages/desktop/AtendimentoDetalhe";
import DesktopClientes from "./pages/desktop/Clientes";
import IniciarVisita from "./pages/desktop/IniciarVisita";
import DesktopResponsaveis from "./pages/desktop/Responsaveis";

// Config
import Configuracoes from "./pages/desktop/Configuracoes";

// Backlog feature removed

const queryClient = new QueryClient();

// Component to handle initial redirect based on device
function RootRedirect() {
  const isMobile = useIsMobile();
  const { ativo, getRotaAtual } = useAtendimento();
  
  // Show nothing while detecting device
  if (isMobile === undefined) {
    return null;
  }

  // If there's an ongoing visit, redirect to saved route
  if (ativo) {
    const savedRoute = getRotaAtual();
    if (savedRoute) {
      return <Navigate to={savedRoute} replace />;
    }
  }
  
  // Desktop now goes to iniciar-visita as the landing page
  return isMobile ? <Index /> : <Navigate to="/desktop/iniciar-visita" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AtendimentoProvider>
          <SyncProvider>
          <ConfigCachePrefetcher />
          <InstallPromptBanner />
          <UpdatePrompt />
          <Routes>
            {/* Root - redirects based on device */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Mobile routes */}
            <Route path="/mobile" element={<Index />} />
            <Route path="/visita/foto-inicial" element={<FotoInicialOpcional />} />
            <Route path="/visita/responsavel" element={<SelecionarResponsavel />} />
            <Route path="/visita/anotacoes" element={<Anotacoes />} />
            <Route path="/visita/tipos" element={<TiposAtendimento />} />
            <Route path="/visita/acoes" element={<AcoesEspecificas />} />
            <Route path="/visita/demandas" element={<SugestoesDemandas />} />
            <Route path="/visita/clientes" element={<SelecionarClientesFinal />} />
            <Route path="/visita/foto-final" element={<FotoFinalObrigatoria />} />
            <Route path="/visita/rapida/tipos" element={<TiposRapida />} />
            <Route path="/visita/rapida/clientes" element={<ClientesRapida />} />
            <Route path="/visita/rapida/responsavel" element={<ResponsavelRapida />} />
            <Route path="/visita/rapida/fotos" element={<FotosRapida />} />
            <Route path="/visita/resumo" element={<ResumoAtendimento />} />
            <Route path="/sucesso" element={<Sucesso />} />
            <Route path="/historico" element={<Historico />} />
            
            {/* Desktop routes */}
            <Route path="/desktop" element={<Dashboard />} />
            <Route path="/desktop/iniciar-visita" element={<IniciarVisita />} />
            <Route path="/desktop/historico" element={<DesktopHistorico />} />
            <Route path="/desktop/atendimento/:id" element={<AtendimentoDetalhe />} />
            <Route path="/desktop/clientes" element={<DesktopClientes />} />
            <Route path="/desktop/responsaveis" element={<DesktopResponsaveis />} />
            
            {/* Config */}
            <Route path="/desktop/configuracoes" element={<Configuracoes />} />
            
            

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SyncProvider>
        </AtendimentoProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
