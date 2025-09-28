import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Church {
  id: string;
  name: string;
  holyrics_ip: string;
  holyrics_port: number;
  api_key?: string;
  token?: string;
  created_at: string;
  updated_at: string;
}

export const useChurches = () => {
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar lista de igrejas
  const loadChurches = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('churches')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao carregar igrejas:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar lista de igrejas",
          variant: "destructive",
        });
        return;
      }

      setChurches(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar igrejas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar nova igreja
  const createChurch = async (churchData: Omit<Church, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('churches')
        .insert([churchData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar igreja:', error);
        toast({
          title: "Erro",
          description: "Falha ao criar nova igreja",
          variant: "destructive",
        });
        return null;
      }

      await loadChurches();
      toast({
        title: "Sucesso",
        description: `Igreja "${churchData.name}" criada com sucesso`,
      });

      return data;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar igreja",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar igreja existente
  const updateChurch = async (id: string, updates: Partial<Omit<Church, 'id' | 'created_at' | 'updated_at'>>) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('churches')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar igreja:', error);
        toast({
          title: "Erro",
          description: "Falha ao atualizar igreja",
          variant: "destructive",
        });
        return null;
      }

      await loadChurches();
      
      // Atualizar igreja selecionada se for a mesma
      if (selectedChurch?.id === id) {
        setSelectedChurch(data);
      }

      toast({
        title: "Sucesso",
        description: "Igreja atualizada com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar igreja",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Selecionar igreja e salvar no localStorage
  const selectChurch = (church: Church) => {
    setSelectedChurch(church);
    localStorage.setItem('selectedChurch', JSON.stringify(church));
    toast({
      title: "Igreja selecionada",
      description: `Conectado à igreja: ${church.name}`,
    });
  };

  // Carregar igreja selecionada do localStorage na inicialização
  useEffect(() => {
    const saved = localStorage.getItem('selectedChurch');
    if (saved) {
      try {
        const church = JSON.parse(saved);
        setSelectedChurch(church);
      } catch (error) {
        console.error('Erro ao carregar igreja salva:', error);
        localStorage.removeItem('selectedChurch');
      }
    }
    loadChurches();
  }, []);

  return {
    churches,
    selectedChurch,
    loading,
    loadChurches,
    createChurch,
    updateChurch,
    selectChurch
  };
};