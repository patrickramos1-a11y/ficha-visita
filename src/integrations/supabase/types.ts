export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acoes_especificas_config: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          naturezas: string[]
          nome: string
          plano_id: string | null
          subtopico_id: string | null
          topico_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          naturezas?: string[]
          nome: string
          plano_id?: string | null
          subtopico_id?: string | null
          topico_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          naturezas?: string[]
          nome?: string
          plano_id?: string | null
          subtopico_id?: string | null
          topico_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_especificas_config_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_especificas_config_subtopico_id_fkey"
            columns: ["subtopico_id"]
            isOneToOne: false
            referencedRelation: "subtopicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_especificas_config_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento_clientes: {
        Row: {
          atendimento_id: string
          cliente_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          atendimento_id: string
          cliente_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          atendimento_id?: string
          cliente_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_clientes_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento_fotos: {
        Row: {
          atendimento_id: string
          created_at: string
          foto_url: string
          id: string
          tipo: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          foto_url: string
          id?: string
          tipo?: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          foto_url?: string
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_fotos_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento_processos: {
        Row: {
          atendimento_id: string
          created_at: string
          orgao_id: string | null
          processo_id: string | null
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          orgao_id?: string | null
          processo_id?: string | null
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          orgao_id?: string | null
          processo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_processos_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_processos_orgao_id_fkey"
            columns: ["orgao_id"]
            isOneToOne: false
            referencedRelation: "orgaos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_processos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos: {
        Row: {
          acoes_especificas: string[] | null
          anotacoes: string | null
          anotacoes_itens: Json
          checklist: Json | null
          cliente_id: string | null
          created_at: string
          dados_modalidade: Json | null
          data_fim: string | null
          data_inicio: string
          finalizado: boolean
          id: string
          link_publico: string | null
          modo: string
          natureza: string
          notas: string | null
          obra_id: string | null
          origem_id: string | null
          possui_foto_final: boolean | null
          responsavel_id: string | null
          tipos_atendimento: string[] | null
          titulo: string | null
          topicos_reuniao: Json | null
          updated_at: string
        }
        Insert: {
          acoes_especificas?: string[] | null
          anotacoes?: string | null
          anotacoes_itens?: Json
          checklist?: Json | null
          cliente_id?: string | null
          created_at?: string
          dados_modalidade?: Json | null
          data_fim?: string | null
          data_inicio?: string
          finalizado?: boolean
          id?: string
          link_publico?: string | null
          modo?: string
          natureza?: string
          notas?: string | null
          obra_id?: string | null
          origem_id?: string | null
          possui_foto_final?: boolean | null
          responsavel_id?: string | null
          tipos_atendimento?: string[] | null
          titulo?: string | null
          topicos_reuniao?: Json | null
          updated_at?: string
        }
        Update: {
          acoes_especificas?: string[] | null
          anotacoes?: string | null
          anotacoes_itens?: Json
          checklist?: Json | null
          cliente_id?: string | null
          created_at?: string
          dados_modalidade?: Json | null
          data_fim?: string | null
          data_inicio?: string
          finalizado?: boolean
          id?: string
          link_publico?: string | null
          modo?: string
          natureza?: string
          notas?: string | null
          obra_id?: string | null
          origem_id?: string | null
          possui_foto_final?: boolean | null
          responsavel_id?: string | null
          tipos_atendimento?: string[] | null
          titulo?: string | null
          topicos_reuniao?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      demandas: {
        Row: {
          atendimento_id: string
          created_at: string
          descricao: string
          id: string
          personalizada: boolean
          plano: Database["public"]["Enums"]["plano_tipo"] | null
          status: string
          subtopico_id: string | null
          tipo_atendimento: string | null
          topico_id: string | null
          updated_at: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          descricao: string
          id?: string
          personalizada?: boolean
          plano?: Database["public"]["Enums"]["plano_tipo"] | null
          status?: string
          subtopico_id?: string | null
          tipo_atendimento?: string | null
          topico_id?: string | null
          updated_at?: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          descricao?: string
          id?: string
          personalizada?: boolean
          plano?: Database["public"]["Enums"]["plano_tipo"] | null
          status?: string
          subtopico_id?: string | null
          tipo_atendimento?: string | null
          topico_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_especificas: {
        Row: {
          ativo: boolean
          created_at: string
          descricao_detalhada: string | null
          id: string
          nome_curto: string
          plano_id: string | null
          subtopico_id: string | null
          topico_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao_detalhada?: string | null
          id?: string
          nome_curto: string
          plano_id?: string | null
          subtopico_id?: string | null
          topico_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao_detalhada?: string | null
          id?: string
          nome_curto?: string
          plano_id?: string | null
          subtopico_id?: string | null
          topico_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_especificas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_especificas_subtopico_id_fkey"
            columns: ["subtopico_id"]
            isOneToOne: false
            referencedRelation: "subtopicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_especificas_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      integracao_radar_itens: {
        Row: {
          atendimento_id: string
          created_at: string
          enviado_em: string | null
          erro: string | null
          id: string
          item_origem_id: string
          radar_cliente_id: string | null
          radar_item_id: string | null
          status: string
          tipo_origem: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          item_origem_id: string
          radar_cliente_id?: string | null
          radar_item_id?: string | null
          status?: string
          tipo_origem: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          item_origem_id?: string
          radar_cliente_id?: string | null
          radar_item_id?: string | null
          status?: string
          tipo_origem?: string
        }
        Relationships: [
          {
            foreignKeyName: "integracao_radar_itens_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      mapeamentos_clientes_radar: {
        Row: {
          cliente_id: string
          origem: string
          radar_cliente_id: string
          radar_cliente_nome: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          origem?: string
          radar_cliente_id: string
          radar_cliente_nome: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          origem?: string
          radar_cliente_id?: string
          radar_cliente_nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapeamentos_clientes_radar_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      naturezas_visita: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      obras: {
        Row: {
          ativo: boolean
          cliente_id: string
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cliente_id: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cliente_id?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      orgaos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      origens: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      planos: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      processos_clientes: {
        Row: {
          ativo: boolean
          cliente_id: string
          created_at: string
          id: string
          nome: string
          obra_id: string | null
          orgao_id: string | null
          situacao_atual: string
        }
        Insert: {
          ativo?: boolean
          cliente_id: string
          created_at?: string
          id?: string
          nome: string
          obra_id?: string | null
          orgao_id?: string | null
          situacao_atual?: string
        }
        Update: {
          ativo?: boolean
          cliente_id?: string
          created_at?: string
          id?: string
          nome?: string
          obra_id?: string | null
          orgao_id?: string | null
          situacao_atual?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_clientes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_clientes_orgao_id_fkey"
            columns: ["orgao_id"]
            isOneToOne: false
            referencedRelation: "orgaos"
            referencedColumns: ["id"]
          },
        ]
      }
      responsaveis: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      status_config: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      subtopicos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          topico_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          topico_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          topico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtopicos_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_atendimento_config: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          naturezas: string[]
          nome: string
          plano_id: string | null
          subtopico_id: string | null
          topico_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          naturezas?: string[]
          nome: string
          plano_id?: string | null
          subtopico_id?: string | null
          topico_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          naturezas?: string[]
          nome?: string
          plano_id?: string | null
          subtopico_id?: string | null
          topico_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_atendimento_config_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_atendimento_config_subtopico_id_fkey"
            columns: ["subtopico_id"]
            isOneToOne: false
            referencedRelation: "subtopicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_atendimento_config_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      topicos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      visita_demandas: {
        Row: {
          atendimento_id: string
          created_at: string
          demanda_especifica_id: string
          id: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          demanda_especifica_id: string
          id?: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          demanda_especifica_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visita_demandas_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visita_demandas_demanda_especifica_id_fkey"
            columns: ["demanda_especifica_id"]
            isOneToOne: false
            referencedRelation: "demandas_especificas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plano_tipo: "VIP" | "Premium" | "Master" | "Integracao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plano_tipo: ["VIP", "Premium", "Master", "Integracao"],
    },
  },
} as const
