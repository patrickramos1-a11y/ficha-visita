import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Link2,
  Loader2,
  Plus,
  Send,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { DesktopLayout } from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { PhotoStorageStatsCard } from "@/components/gestao/PhotoStorageStatsCard";

const db = supabase as any;
const natureLabels: Record<string, string> = {
  ATENDIMENTO: "Atendimento",
  OBRAS: "Acompanhamento de Obras",
  AMBIENTAL: "Acompanhamento Ambiental",
  PROCESSOS: "Acompanhamento de Processos",
};
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
const getVisitNature = (visit: any) =>
  visit.natureza ||
  (visit.modo === "obras"
    ? "OBRAS"
    : visit.modo === "ambiental"
      ? "AMBIENTAL"
      : visit.modo === "processos"
        ? "PROCESSOS"
        : "ATENDIMENTO");

function useOptionalTable(table: string, queryKey: string) {
  return useQuery({
    queryKey: [queryKey],
    retry: false,
    queryFn: async () => {
      const { data, error } = await db.from(table).select("*").order("nome");
      if (error) return [];
      return data ?? [];
    },
  });
}

export default function Gestao() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [tab, setTab] = useState("visao");
  const [newNature, setNewNature] = useState("");
  const [newOrgao, setNewOrgao] = useState("");
  const [newProcesso, setNewProcesso] = useState("");
  const [processoCliente, setProcessoCliente] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [visitClientFilter, setVisitClientFilter] = useState("ALL");
  const [visitNatureFilter, setVisitNatureFilter] = useState("ALL");
  const [visitResponsibleFilter, setVisitResponsibleFilter] = useState("ALL");
  const [visitStatusFilter, setVisitStatusFilter] = useState("ALL");
  const [confirmVisit, setConfirmVisit] = useState<any | null>(null);
  const [radarClients, setRadarClients] = useState<any[]>([]);
  const [radarClientId, setRadarClientId] = useState("");
  const [radarSearch, setRadarSearch] = useState("");
  const [newRadarClientName, setNewRadarClientName] = useState("");
  const [loadingRadarClients, setLoadingRadarClients] = useState(false);
  const [batchVisits, setBatchVisits] = useState<any[]>([]);
  const [batchRadarClients, setBatchRadarClients] = useState<Record<string, any[]>>({});
  const [batchRadarClientIds, setBatchRadarClientIds] = useState<Record<string, string>>({});
  const [batchRadarSearches, setBatchRadarSearches] = useState<Record<string, string>>({});
  const [batchNewClientNames, setBatchNewClientNames] = useState<Record<string, string>>({});
  const [batchLoadingClients, setBatchLoadingClients] = useState<Record<string, boolean>>({});
  const { data: visitas = [], isLoading } = useQuery({
    queryKey: ["gestao-visitas"],
    queryFn: async () => {
      const { data, error } = await db
        .from("atendimentos")
        .select("*, atendimento_clientes(cliente_id, clientes(id,nome))")
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: clientes = [] } = useQuery({
    queryKey: ["gestao-clientes"],
    queryFn: async () => {
      const { data, error } = await db
        .from("clientes")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: responsaveis = [] } = useQuery({
    queryKey: ["gestao-responsaveis"],
    queryFn: async () => {
      const { data, error } = await db
        .from("responsaveis")
        .select("id,nome")
        .order("nome");
      return error ? [] : (data ?? []);
    },
  });
  const { data: demandas = [] } = useQuery({
    queryKey: ["gestao-demandas"],
    queryFn: async () => {
      const { data, error } = await db.from("demandas").select("*");
      return error ? [] : (data ?? []);
    },
  });
  const { data: naturezas = [] } = useOptionalTable(
    "naturezas_visita",
    "gestao-naturezas",
  );
  const { data: orgaos = [] } = useOptionalTable("orgaos", "gestao-orgaos");
  const { data: processos = [] } = useOptionalTable(
    "processos_clientes",
    "gestao-processos",
  );
  const { data: exportados = [] } = useQuery({
    queryKey: ["gestao-exportados"],
    retry: false,
    queryFn: async () => {
      const { data, error } = await db
        .from("integracao_radar_itens")
        .select("*");
      return error ? [] : (data ?? []);
    },
  });
  const { data: mapeamentosRadar = [] } = useQuery({
    queryKey: ["gestao-mapeamentos-radar"],
    retry: false,
    queryFn: async () => {
      const { data, error } = await db
        .from("mapeamentos_clientes_radar")
        .select("*");
      return error ? [] : (data ?? []);
    },
  });

  const visitsWithItems = useMemo(
    () =>
      visitas.map((visit: any) => ({
        ...visit,
        demandas: demandas.filter(
          (item: any) => item.atendimento_id === visit.id,
        ),
      })),
    [visitas, demandas],
  );
  const yearVisits = useMemo(
    () =>
      visitsWithItems.filter(
        (visit: any) =>
          new Date(visit.data_inicio ?? visit.created_at).getFullYear() ===
          Number(year),
      ),
    [visitsWithItems, year],
  );
  const monthly = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        mes: monthFormatter
          .format(new Date(Number(year), index, 1))
          .replace(".", ""),
        visitas: yearVisits.filter(
          (visit: any) =>
            new Date(visit.data_inicio ?? visit.created_at).getMonth() ===
            index,
        ).length,
      })),
    [year, yearVisits],
  );
  const natureCounts = useMemo(
    () =>
      Object.entries(natureLabels).map(([codigo, nome]) => ({
        codigo,
        nome,
        total: yearVisits.filter(
          (visit: any) => getVisitNature(visit) === codigo,
        ).length,
      })),
    [yearVisits],
  );
  const clientRows = useMemo(
    () =>
      clientes
        .map((cliente: any) => {
          const related = yearVisits.filter(
            (visit: any) =>
              (visit.atendimento_clientes ?? []).some(
                (row: any) => row.cliente_id === cliente.id,
              ) ||
              visit.cliente_id === cliente.id ||
              visit.dados_modalidade?.cliente_id === cliente.id,
          );
          const tipos = [
            ...new Set(
              related.flatMap((visit: any) => visit.tipos_atendimento ?? []),
            ),
          ];
          const acoes = [
            ...new Set(
              related.flatMap((visit: any) => visit.acoes_especificas ?? []),
            ),
          ];
          return { cliente, related, tipos, acoes };
        })
        .filter((row) => row.related.length > 0),
    [clientes, yearVisits],
  );
  const pendingVisits = useMemo(
    () =>
      yearVisits.filter((visit: any) => {
        const demands = (visit.demandas ?? []).filter((item: any) =>
          item.descricao?.trim(),
        );
        const notes = visit.anotacoes_itens ?? [];
        return visit.finalizado && demands.length + notes.length > 0;
      }),
    [yearVisits],
  );

  const saveNature = async () => {
    if (!newNature.trim()) return;
    const code = newNature
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_");
    const { error } = await db
      .from("naturezas_visita")
      .insert({ codigo: code, nome: newNature.trim(), ativo: true });
    if (error)
      return toast.error("Aplique primeiro o SQL da Gestão no Supabase");
    setNewNature("");
    queryClient.invalidateQueries({ queryKey: ["gestao-naturezas"] });
  };
  const saveOrgao = async () => {
    if (!newOrgao.trim()) return;
    const { error } = await db
      .from("orgaos")
      .insert({ nome: newOrgao.trim(), ativo: true });
    if (error)
      return toast.error("Aplique primeiro o SQL da Gestão no Supabase");
    setNewOrgao("");
    queryClient.invalidateQueries({ queryKey: ["gestao-orgaos"] });
  };
  const saveProcesso = async () => {
    if (!newProcesso.trim() || !processoCliente) return;
    const { error } = await db
      .from("processos_clientes")
      .insert({
        nome: newProcesso.trim(),
        cliente_id: processoCliente,
        ativo: true,
      });
    if (error)
      return toast.error("Aplique primeiro o SQL da Gestão no Supabase");
    setNewProcesso("");
    queryClient.invalidateQueries({ queryKey: ["gestao-processos"] });
  };
  const clientName = (visit: any) =>
    visit.atendimento_clientes?.[0]?.clientes?.nome ||
    clientes.find((client: any) => client.id === visit.cliente_id)?.nome ||
    visit.dados_modalidade?.cliente_nome ||
    "Cliente não identificado";
  const clientId = (visit: any) =>
    visit.atendimento_clientes?.[0]?.cliente_id ||
    visit.cliente_id ||
    visit.dados_modalidade?.cliente_id;
  const responsavelName = (visit: any) =>
    responsaveis.find(
      (responsavel: any) => responsavel.id === visit.responsavel_id,
    )?.nome || "Ficha de Visita";
  const filteredVisits = useMemo(
    () =>
      visitas.filter(
        (visit: any) =>
          (visitClientFilter === "ALL" ||
            clientId(visit) === visitClientFilter ||
            (visit.atendimento_clientes ?? []).some(
              (row: any) => row.cliente_id === visitClientFilter,
            )) &&
          (visitNatureFilter === "ALL" ||
            getVisitNature(visit) === visitNatureFilter) &&
          (visitResponsibleFilter === "ALL" ||
            visit.responsavel_id === visitResponsibleFilter) &&
          (visitStatusFilter === "ALL" ||
            (visitStatusFilter === "FINALIZADA"
              ? visit.finalizado
              : !visit.finalizado)),
      ),
    [
      visitas,
      visitClientFilter,
      visitNatureFilter,
      visitResponsibleFilter,
      visitStatusFilter,
      clientes,
      responsaveis,
    ],
  );
  const exportItems = (visit: any) => [
    ...(visit.demandas ?? [])
      .filter((item: any) => item.descricao?.trim())
      .map((item: any) => ({
        key: `D:${item.id}`,
        label: item.descricao,
        kind: "DEMANDA",
      })),
    ...(visit.anotacoes_itens ?? [])
      .filter((item: any) => item.texto?.trim())
      .map((item: any) => ({
        key: `N:${item.id}`,
        label: item.texto,
        kind: "ANOTACAO",
      })),
  ];
  const sentRecord = (visit: any, item: { key: string }) =>
    exportados.find(
      (record: any) =>
        record.atendimento_id === visit.id &&
        record.status === "ENVIADO" &&
        `${record.tipo_origem === "DEMANDA" ? "D" : "N"}:${record.item_origem_id}` ===
          item.key,
    );
  const unsentItems = (visit: any) =>
    exportItems(visit).filter((item) => !sentRecord(visit, item));
  const selectedKeys = (visit: any) =>
    selection[visit.id] ?? unsentItems(visit).map((item) => item.key);
  const selectedUnsentKeys = (visit: any) =>
    selectedKeys(visit).filter((key) =>
      unsentItems(visit).some((item) => item.key === key),
    );
  const selectedExportItems = (visit: any) =>
    exportItems(visit).filter((item) =>
      selectedUnsentKeys(visit).includes(item.key),
    );
  const batchTotals = (visits: any[]) => {
    const items = visits.flatMap((visit: any) => selectedExportItems(visit));
    return {
      visits: visits.length,
      demands: items.filter((item) => item.kind === "DEMANDA").length,
      notes: items.filter((item) => item.kind === "ANOTACAO").length,
      items: items.length,
    };
  };
  const isSent = (visit: any) =>
    exportItems(visit).length > 0 && unsentItems(visit).length === 0;
  const toggleExportItem = (visit: any, key: string) =>
    setSelection((current) => {
      const selected = selectedKeys(visit);
      return {
        ...current,
        [visit.id]: selected.includes(key)
          ? selected.filter((item) => item !== key)
          : [...selected, key],
      };
    });
  const selectAllItems = () =>
    setSelection(
      Object.fromEntries(
        pendingVisits.map((visit: any) => [
          visit.id,
          unsentItems(visit).map((item) => item.key),
        ]),
      ),
    );
  const clearAllItems = () =>
    setSelection(
      Object.fromEntries(pendingVisits.map((visit: any) => [visit.id, []])),
    );
  const suggestedMapping = (visit: any) =>
    mapeamentosRadar.find((item: any) => item.cliente_id === clientId(visit));
  const loadRadarClients = async (visit: any, search = clientName(visit)) => {
    setLoadingRadarClients(true);
    try {
      const response = await fetch(
        `/api/radar-import?q=${encodeURIComponent(search)}`,
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Falha ao consultar clientes do Radar");
      let clients = payload.clients ?? [];
      const foundSuggestion = clients.length > 0;
      if (search.trim() && clients.length === 0) {
        const fallbackResponse = await fetch("/api/radar-import?q=");
        const fallbackPayload = await fallbackResponse.json();
        if (!fallbackResponse.ok)
          throw new Error(
            fallbackPayload.error || "Falha ao consultar clientes do Radar",
          );
        clients = fallbackPayload.clients ?? [];
      }
      const mapped = suggestedMapping(visit);
      setRadarClients(clients);
      setRadarClientId(
        mapped?.radar_cliente_id || (foundSuggestion ? clients?.[0]?.id : "") || "",
      );
      setNewRadarClientName(clientName(visit));
      setRadarSearch(search);
    } catch (error: any) {
      toast.error(error.message || "Nao foi possivel consultar clientes do Radar");
    } finally {
      setLoadingRadarClients(false);
    }
  };
  const openConfirm = (visit: any) => {
    if (selectedUnsentKeys(visit).length === 0)
      return toast.message("Selecione pelo menos um item pendente.");
    setConfirmVisit(visit);
    loadRadarClients(visit);
  };
  const closeConfirm = () => {
    setConfirmVisit(null);
    setRadarClientId("");
    setRadarSearch("");
    setNewRadarClientName("");
    setRadarClients([]);
  };
  const sendVisit = async (
    visit: any,
    options: { radarClientId?: string; createRadarClientName?: string } = {},
  ) => {
    const selected = selectedKeys(visit);
    const demands = (visit.demandas ?? []).filter(
      (item: any) =>
        item.descricao?.trim() &&
        selected.includes(`D:${item.id}`) &&
        !sentRecord(visit, { key: `D:${item.id}` }),
    );
    const notes = (visit.anotacoes_itens ?? []).filter(
      (item: any) =>
        item.texto?.trim() &&
        selected.includes(`N:${item.id}`) &&
        !sentRecord(visit, { key: `N:${item.id}` }),
    );
    if (!demands.length && !notes.length)
      return toast.message("Esta visita nao possui itens para enviar.");
    setSending(visit.id);
    try {
      const response = await fetch("/api/radar-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visit: {
            id: visit.id,
            title: visit.titulo,
            date: visit.data_inicio ?? visit.created_at,
            clientName: clientName(visit),
            clientId: clientId(visit),
            responsavelNome: responsavelName(visit),
          },
          demands,
          notes,
          ...options,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Falha ao enviar ao Radar");
      if (payload.failed) {
        toast.warning(
          `${payload.created ?? 0} item(ns) enviados e ${payload.failed} com falha.`,
        );
      } else {
        toast.success(`${payload.created ?? 0} item(ns) enviados ao Radar Vital`);
      }
      queryClient.invalidateQueries({ queryKey: ["gestao-exportados"] });
      queryClient.invalidateQueries({ queryKey: ["gestao-mapeamentos-radar"] });
      closeConfirm();
    } catch (error: any) {
      toast.error(error.message || "Nao foi possivel enviar ao Radar");
    } finally {
      setSending(null);
    }
  };
  const loadBatchRadarClients = async (visit: any, search = clientName(visit)) => {
    setBatchLoadingClients((current) => ({ ...current, [visit.id]: true }));
    try {
      const response = await fetch(
        `/api/radar-import?q=${encodeURIComponent(search)}`,
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Falha ao consultar clientes do Radar");
      let clients = payload.clients ?? [];
      const foundSuggestion = clients.length > 0;
      if (search.trim() && clients.length === 0) {
        const fallbackResponse = await fetch("/api/radar-import?q=");
        const fallbackPayload = await fallbackResponse.json();
        if (!fallbackResponse.ok)
          throw new Error(
            fallbackPayload.error || "Falha ao consultar clientes do Radar",
          );
        clients = fallbackPayload.clients ?? [];
      }
      setBatchRadarClients((current) => ({
        ...current,
        [visit.id]: clients,
      }));
      if (foundSuggestion) {
        setBatchRadarClientIds((current) => ({
          ...current,
          [visit.id]: current[visit.id] || clients[0]?.id || "",
        }));
        setBatchNewClientNames((current) => ({
          ...current,
          [visit.id]: "",
        }));
      }
      setBatchRadarSearches((current) => ({ ...current, [visit.id]: search }));
    } catch (error: any) {
      toast.error(error.message || "Nao foi possivel consultar clientes do Radar");
    } finally {
      setBatchLoadingClients((current) => ({ ...current, [visit.id]: false }));
    }
  };
  const openBatchConfirm = (visitsToSend: any[]) => {
    const initialClients: Record<string, any[]> = {};
    const initialClientIds: Record<string, string> = {};
    const initialSearches: Record<string, string> = {};
    const initialNewNames: Record<string, string> = {};

    visitsToSend.forEach((visit: any) => {
      const mapped = suggestedMapping(visit);
      initialSearches[visit.id] = clientName(visit);
      initialNewNames[visit.id] = "";
      if (mapped) {
        initialClientIds[visit.id] = mapped.radar_cliente_id;
        initialClients[visit.id] = [
          {
            id: mapped.radar_cliente_id,
            name: mapped.radar_cliente_nome,
            score: 100,
          },
        ];
      } else {
        initialClientIds[visit.id] = "";
        initialClients[visit.id] = [];
      }
    });

    setBatchVisits(visitsToSend);
    setBatchRadarClients(initialClients);
    setBatchRadarClientIds(initialClientIds);
    setBatchRadarSearches(initialSearches);
    setBatchNewClientNames(initialNewNames);
    setBatchLoadingClients({});

    visitsToSend
      .filter((visit: any) => !suggestedMapping(visit))
      .forEach((visit: any) => loadBatchRadarClients(visit));
  };
  const closeBatchConfirm = () => {
    setBatchVisits([]);
    setBatchRadarClients({});
    setBatchRadarClientIds({});
    setBatchRadarSearches({});
    setBatchNewClientNames({});
    setBatchLoadingClients({});
  };
  const batchReady =
    batchVisits.length > 0 &&
    batchVisits.every(
      (visit: any) =>
        batchRadarClientIds[visit.id] ||
        batchNewClientNames[visit.id]?.trim(),
    );
  const confirmBatchSend = async () => {
    if (!batchReady)
      return toast.message("Confirme o cliente do Radar para todas as visitas.");

    let totalCreated = 0;
    let totalFailed = 0;
    setSending("BATCH");
    try {
      for (const visit of batchVisits) {
        const selectedClientId = batchRadarClientIds[visit.id];
        const createName = batchNewClientNames[visit.id]?.trim();
        const options = selectedClientId
          ? { radarClientId: selectedClientId }
          : { createRadarClientName: createName };

        const selected = selectedKeys(visit);
        const demands = (visit.demandas ?? []).filter(
          (item: any) =>
            item.descricao?.trim() &&
            selected.includes(`D:${item.id}`) &&
            !sentRecord(visit, { key: `D:${item.id}` }),
        );
        const notes = (visit.anotacoes_itens ?? []).filter(
          (item: any) =>
            item.texto?.trim() &&
            selected.includes(`N:${item.id}`) &&
            !sentRecord(visit, { key: `N:${item.id}` }),
        );
        if (!demands.length && !notes.length) continue;

        setSending(visit.id);
        const response = await fetch("/api/radar-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visit: {
              id: visit.id,
              title: visit.titulo,
              date: visit.data_inicio ?? visit.created_at,
              clientName: clientName(visit),
              clientId: clientId(visit),
              responsavelNome: responsavelName(visit),
            },
            demands,
            notes,
            ...options,
          }),
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error || "Falha ao enviar ao Radar");
        totalCreated += payload.created ?? 0;
        totalFailed += payload.failed ?? 0;
      }

      if (totalFailed) {
        toast.warning(
          `${totalCreated} item(ns) enviados e ${totalFailed} com falha.`,
        );
      } else {
        toast.success(`${totalCreated} item(ns) enviados ao Radar Vital`);
      }
      queryClient.invalidateQueries({ queryKey: ["gestao-exportados"] });
      queryClient.invalidateQueries({ queryKey: ["gestao-mapeamentos-radar"] });
      closeBatchConfirm();
    } catch (error: any) {
      toast.error(error.message || "Nao foi possivel enviar ao Radar");
    } finally {
      setSending(null);
    }
  };
  const sendAllSelected = async () => {
    const visitsToSend = pendingVisits.filter(
      (visit: any) => selectedUnsentKeys(visit).length > 0 && !isSent(visit),
    );
    if (!visitsToSend.length)
      return toast.message("Nenhum item pendente selecionado.");
    openBatchConfirm(visitsToSend);
  };

  return (
    <DesktopLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Gestão de Visitas</h2>
            <p className="text-sm text-muted-foreground">
              Indicadores, cadastros e encaminhamentos ao Radar Vital.
            </p>
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, index) =>
                String(new Date().getFullYear() - index),
              ).map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
            <TabsTrigger value="visitas">Visitas</TabsTrigger>
            <TabsTrigger value="temporal">Temporal</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="naturezas">Naturezas</TabsTrigger>
            <TabsTrigger value="processos">Processos</TabsTrigger>
            <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          </TabsList>
          <TabsContent value="visao" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Metric
                icon={CalendarDays}
                label="Visitas no ano"
                value={yearVisits.length}
              />
              <Metric
                icon={Users}
                label="Clientes atendidos"
                value={clientRows.length}
              />
              <Metric
                icon={CheckCircle2}
                label="Ações executadas"
                value={yearVisits.reduce(
                  (total: number, visit: any) =>
                    total + (visit.acoes_especificas?.length ?? 0),
                  0,
                )}
              />
              <Metric
                icon={Send}
                label="Na fila do Radar"
                value={pendingVisits.filter((visit) => !isSent(visit)).length}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {natureCounts.map((item) => (
                <Card key={item.codigo}>
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="text-sm">{item.nome}</span>
                    <strong className="text-xl">{item.total}</strong>
                  </CardContent>
                </Card>
              ))}
            </div>
            <PhotoStorageStatsCard />
          </TabsContent>
          <TabsContent value="visitas" className="space-y-4">
            <Card>
              <CardContent className="grid gap-3 p-4 md:grid-cols-4">
                <Select
                  value={visitClientFilter}
                  onValueChange={setVisitClientFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os clientes</SelectItem>
                    {clientes.map((cliente: any) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={visitResponsibleFilter}
                  onValueChange={setVisitResponsibleFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os responsáveis</SelectItem>
                    {responsaveis.map((responsavel: any) => (
                      <SelectItem key={responsavel.id} value={responsavel.id}>
                        {responsavel.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={visitNatureFilter}
                  onValueChange={setVisitNatureFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Natureza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as naturezas</SelectItem>
                    {Object.entries(natureLabels).map(([codigo, nome]) => (
                      <SelectItem key={codigo} value={codigo}>
                        {nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={visitStatusFilter}
                  onValueChange={setVisitStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os estados</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                    <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left">
                      <tr>
                        <th className="p-3">Data</th>
                        <th className="p-3">Título</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Natureza</th>
                        <th className="p-3">Responsável</th>
                        <th className="p-3">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVisits.map((visit: any) => (
                        <tr key={visit.id} className="border-b last:border-0">
                          <td className="whitespace-nowrap p-3">
                            {new Date(
                              visit.data_inicio ?? visit.created_at,
                            ).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-3 font-medium">
                            {visit.titulo || "Visita sem título"}
                          </td>
                          <td className="p-3">{clientName(visit)}</td>
                          <td className="p-3">
                            {natureLabels[getVisitNature(visit)]}
                          </td>
                          <td className="p-3">{responsavelName(visit)}</td>
                          <td className="p-3">
                            <span
                              className={
                                visit.finalizado
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }
                            >
                              {visit.finalizado ? "Finalizada" : "Em andamento"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredVisits.length === 0 && (
                        <tr>
                          <td
                            className="p-8 text-center text-muted-foreground"
                            colSpan={6}
                          >
                            Nenhuma visita encontrada para os filtros
                            escolhidos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="temporal">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visitas por mês</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="mes" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="visitas"
                      fill="hsl(var(--primary))"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="clientes">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left">
                      <tr>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Visitas</th>
                        <th className="p-3">Atendimentos</th>
                        <th className="p-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientRows.map(({ cliente, related, tipos, acoes }) => (
                        <tr key={cliente.id} className="border-b last:border-0">
                          <td className="p-3 font-medium">{cliente.nome}</td>
                          <td className="p-3">{related.length}</td>
                          <td className="p-3">{tipos.join(", ") || "—"}</td>
                          <td className="p-3">{acoes.join(", ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="naturezas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Naturezas de visita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newNature}
                    onChange={(event) => setNewNature(event.target.value)}
                    placeholder="Nova natureza"
                    disabled
                  />
                  <Button
                    type="button"
                    onClick={saveNature}
                    disabled
                    title="As naturezas iniciais são fixas nesta versão"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
                {(naturezas.length
                  ? naturezas
                  : Object.entries(natureLabels).map(([codigo, nome]) => ({
                      codigo,
                      nome,
                      ativo: true,
                    }))
                ).map((item: any) => (
                  <div
                    key={item.codigo}
                    className="flex items-center justify-between border-b py-3"
                  >
                    <span>{item.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.ativo === false ? "Inativa" : "Ativa"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="processos" className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Landmark className="h-4 w-4" />
                  Órgãos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newOrgao}
                    onChange={(event) => setNewOrgao(event.target.value)}
                    placeholder="Novo órgão"
                  />
                  <Button type="button" size="icon" onClick={saveOrgao}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {orgaos.map((item: any) => (
                  <p key={item.id} className="border-b py-2 text-sm">
                    {item.nome}
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Processos por cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={processoCliente}
                  onValueChange={setProcessoCliente}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    value={newProcesso}
                    onChange={(event) => setNewProcesso(event.target.value)}
                    placeholder="Novo processo"
                  />
                  <Button type="button" size="icon" onClick={saveProcesso}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {processos
                  .filter(
                    (item: any) =>
                      !processoCliente || item.cliente_id === processoCliente,
                  )
                  .map((item: any) => (
                    <p key={item.id} className="border-b py-2 text-sm">
                      {item.nome}
                    </p>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="integracoes" className="space-y-3">
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">Envio para o Radar Vital</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingVisits.reduce(
                      (total: number, visit: any) =>
                        total + unsentItems(visit).length,
                      0,
                    )}{" "}
                    item(ns) pendente(s) em {pendingVisits.length} visita(s).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={selectAllItems}>
                    Selecionar todos
                  </Button>
                  <Button type="button" variant="outline" onClick={clearAllItems}>
                    Desmarcar todos
                  </Button>
                  <Button
                    type="button"
                    onClick={sendAllSelected}
                    disabled={!!sending}
                  >
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar todos selecionados
                  </Button>
                </div>
              </CardContent>
            </Card>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              pendingVisits.map((visit: any) => {
                const items = exportItems(visit);
                const pending = unsentItems(visit);
                const mapped = suggestedMapping(visit);

                return (
                  <Card
                    key={visit.id}
                    className={
                      pending.length === 0
                        ? "border-emerald-200 bg-emerald-50/40"
                        : ""
                    }
                  >
                    <CardContent className="space-y-4 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {visit.titulo || "Visita sem titulo"}
                            </p>
                            {pending.length === 0 && (
                              <Badge className="bg-emerald-600">
                                Enviado ao Radar
                              </Badge>
                            )}
                            {mapped && pending.length > 0 && (
                              <Badge variant="outline">
                                Vinculo: {mapped.radar_cliente_nome}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {clientName(visit)} - {" "}
                            {new Date(
                              visit.data_inicio ?? visit.created_at,
                            ).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pending.length} pendente(s) de {items.length}{" "}
                            item(ns)
                          </p>
                        </div>
                        <Button
                          onClick={() => openConfirm(visit)}
                          disabled={
                            sending === visit.id ||
                            pending.length === 0 ||
                            selectedUnsentKeys(visit).length === 0
                          }
                        >
                          {sending === visit.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : pending.length === 0 ? (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          ) : (
                            <ExternalLink className="mr-2 h-4 w-4" />
                          )}
                          {pending.length === 0
                            ? "Itens enviados"
                            : "Enviar selecionados"}
                        </Button>
                      </div>
                      <div className="space-y-2 border-t pt-3">
                        {items.map((item) => {
                          const sent = sentRecord(visit, item);
                          return (
                            <label
                              key={item.key}
                              className={
                                "flex items-start gap-3 rounded-md p-2 text-sm " +
                                (sent
                                  ? "bg-emerald-50 text-muted-foreground"
                                  : "cursor-pointer hover:bg-muted/60")
                              }
                            >
                              <Checkbox
                                checked={
                                  sent
                                    ? true
                                    : selectedKeys(visit).includes(item.key)
                                }
                                disabled={!!sent}
                                onCheckedChange={() =>
                                  toggleExportItem(visit, item.key)
                                }
                              />
                              <span className="min-w-0 flex-1">
                                <span className="mr-2 text-xs text-muted-foreground">
                                  {item.kind === "DEMANDA"
                                    ? "Demanda"
                                    : "Anotacao"}
                                </span>
                                {item.label}
                              </span>
                              {sent && (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-200 text-emerald-700"
                                >
                                  Enviado
                                </Badge>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
            {!isLoading && pendingVisits.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma demanda ou anotação pendente para envio.
              </p>
            )}
          </TabsContent>
        </Tabs>
        <Dialog
          open={batchVisits.length > 0}
          onOpenChange={(open) => !open && closeBatchConfirm()}
        >
          <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
            <DialogHeader>
              <DialogTitle>Confirmar envio em lote ao Radar Vital</DialogTitle>
              <DialogDescription>
                Revise todos os clientes antes de enviar demandas e anotações.
              </DialogDescription>
            </DialogHeader>
            {batchVisits.length > 0 && (
              <div className="space-y-4 overflow-hidden">
                <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-4">
                  {(() => {
                    const totals = batchTotals(batchVisits);
                    return (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Visitas</p>
                          <p className="font-semibold">{totals.visits}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Demandas</p>
                          <p className="font-semibold">{totals.demands}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Anotações</p>
                          <p className="font-semibold">{totals.notes}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Itens</p>
                          <p className="font-semibold">{totals.items}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
                  {batchVisits.map((visit: any) => {
                    const mapped = suggestedMapping(visit);
                    const selectedItems = selectedExportItems(visit);
                    const selectedClientId = batchRadarClientIds[visit.id] ?? "";
                    const createName = batchNewClientNames[visit.id] ?? "";
                    const needsDecision = !selectedClientId && !createName.trim();

                    return (
                      <div
                        key={visit.id}
                        className={
                          "space-y-3 rounded-md border p-3 " +
                          (needsDecision ? "border-amber-200 bg-amber-50/40" : "")
                        }
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">
                                {visit.titulo || "Visita sem titulo"}
                              </p>
                              {mapped ? (
                                <Badge variant="outline">Vínculo salvo</Badge>
                              ) : needsDecision ? (
                                <Badge variant="outline" className="border-amber-300">
                                  Precisa confirmar
                                </Badge>
                              ) : (
                                <Badge variant="outline">Confirmado</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {clientName(visit)} -{" "}
                              {new Date(
                                visit.data_inicio ?? visit.created_at,
                              ).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedItems.length} item(ns) selecionado(s)
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-[1fr,1fr]">
                          <div className="space-y-2">
                            <Label>Cliente no Radar Vital</Label>
                            <div className="flex gap-2">
                              <Input
                                value={batchRadarSearches[visit.id] ?? ""}
                                onChange={(event) =>
                                  setBatchRadarSearches((current) => ({
                                    ...current,
                                    [visit.id]: event.target.value,
                                  }))
                                }
                                placeholder="Buscar cliente no Radar"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  loadBatchRadarClients(
                                    visit,
                                    batchRadarSearches[visit.id] || clientName(visit),
                                  )
                                }
                              >
                                Buscar
                              </Button>
                            </div>
                            {batchLoadingClients[visit.id] ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Buscando clientes...
                              </div>
                            ) : (
                              <Select
                                value={selectedClientId}
                                onValueChange={(value) => {
                                  setBatchRadarClientIds((current) => ({
                                    ...current,
                                    [visit.id]: value,
                                  }));
                                  setBatchNewClientNames((current) => ({
                                    ...current,
                                    [visit.id]: "",
                                  }));
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar cliente manualmente" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(batchRadarClients[visit.id] ?? []).map(
                                    (client: any) => (
                                      <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                        {client.score ? ` (${client.score}%)` : ""}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Criar novo cliente no Radar</Label>
                            <Input
                              value={createName}
                              onChange={(event) => {
                                const value = event.target.value;
                                setBatchNewClientNames((current) => ({
                                  ...current,
                                  [visit.id]: value,
                                }));
                                if (value.trim()) {
                                  setBatchRadarClientIds((current) => ({
                                    ...current,
                                    [visit.id]: "",
                                  }));
                                }
                              }}
                              placeholder={clientName(visit)}
                            />
                          </div>
                        </div>
                        <div className="max-h-28 space-y-2 overflow-y-auto rounded-md border bg-background p-2">
                          {selectedItems.map((item) => (
                            <div key={item.key} className="text-sm">
                              <span className="mr-2 text-xs text-muted-foreground">
                                {item.kind === "DEMANDA" ? "Tarefa" : "Comentário"}
                              </span>
                              <span className="break-words">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeBatchConfirm}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!batchReady || !!sending}
                onClick={confirmBatchSend}
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Confirmar envio em lote
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!confirmVisit} onOpenChange={(open) => !open && closeConfirm()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Confirmar envio ao Radar Vital</DialogTitle>
              <DialogDescription>
                Revise o cliente de destino antes de transformar demandas em
                tarefas e anotações em comentários.
              </DialogDescription>
            </DialogHeader>
            {confirmVisit && (
              <div className="space-y-4">
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">
                    {confirmVisit.titulo || "Visita sem título"}
                  </p>
                  <p className="text-muted-foreground">
                    Cliente na Ficha: {clientName(confirmVisit)}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedUnsentKeys(confirmVisit).length} item(ns)
                    selecionado(s) para envio.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Cliente no Radar Vital</Label>
                  <div className="flex gap-2">
                    <Input
                      value={radarSearch}
                      onChange={(event) => setRadarSearch(event.target.value)}
                      placeholder="Buscar cliente no Radar"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => loadRadarClients(confirmVisit, radarSearch)}
                    >
                      Buscar
                    </Button>
                  </div>
                  {loadingRadarClients ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando clientes...
                    </div>
                  ) : (
                    <Select value={radarClientId} onValueChange={setRadarClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cliente manualmente" />
                      </SelectTrigger>
                      <SelectContent>
                        {radarClients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                            {client.score ? ` (${client.score}%)` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Criar novo cliente no Radar</Label>
                  <Input
                    value={newRadarClientName}
                    onChange={(event) => setNewRadarClientName(event.target.value)}
                    placeholder="Nome do novo cliente"
                  />
                </div>
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">
                  {exportItems(confirmVisit)
                    .filter((item) =>
                      selectedUnsentKeys(confirmVisit).includes(item.key),
                    )
                    .map((item) => (
                      <div key={item.key} className="text-sm">
                        <span className="mr-2 text-xs text-muted-foreground">
                          {item.kind === "DEMANDA" ? "Tarefa" : "Comentario"}
                        </span>
                        {item.label}
                      </div>
                    ))}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeConfirm}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!confirmVisit || !newRadarClientName.trim() || !!sending}
                onClick={() =>
                  confirmVisit &&
                  sendVisit(confirmVisit, {
                    createRadarClientName: newRadarClientName.trim(),
                  })
                }
              >
                Criar novo e enviar
              </Button>
              <Button
                type="button"
                disabled={!confirmVisit || !radarClientId || !!sending}
                onClick={() =>
                  confirmVisit && sendVisit(confirmVisit, { radarClientId })
                }
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Confirmar envio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DesktopLayout>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
