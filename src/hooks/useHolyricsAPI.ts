import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { HolyricsConfig } from "@/types/holyrics-config";

export const useHolyricsAPI = () => {
  const callHolyricsAPI = async (action: string, data?: Record<string, any>) => {
    try {
      console.log(`Calling Holyrics API: ${action}`, data);

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Não autenticado",
          description: "Por favor, faça login para continuar",
          variant: "destructive",
        });
        return null;
      }

      // Call edge function with authentication
      const { data: result, error } = await supabase.functions.invoke('holyrics-control', {
        body: { action, data }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Erro ao comunicar com Holyrics",
          description: error.message || "Verifique sua conexão e configuração",
          variant: "destructive",
        });
        return null;
      }

      console.log('Holyrics API response:', result);

      if (result?.status === 'error') {
        toast({
          title: "Erro do Holyrics",
          description: result.error?.message || "Erro desconhecido",
          variant: "destructive",
        });
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error calling Holyrics API:', error);
      toast({
        title: "Erro",
        description: "Falha ao comunicar com o servidor",
        variant: "destructive",
      });
      return null;
    }
  };

  const openBible = () => callHolyricsAPI('OpenBible');
  const closeBible = () => callHolyricsAPI('CloseBible');
  const nextVerse = () => callHolyricsAPI('NextVerse');
  const previousVerse = () => callHolyricsAPI('PreviousVerse');
  const showImage = (imageName: string) => callHolyricsAPI('ShowImage', { name: imageName });
  const getCPInfo = () => callHolyricsAPI('GetCPInfo');
  const getImages = () => callHolyricsAPI('GetImages');
  const showVerse = (reference: string) => callHolyricsAPI('ShowVerse', { references: reference });
  const toggleF8 = () => callHolyricsAPI('ToggleF8');
  const toggleF9 = () => callHolyricsAPI('ToggleF9');
  const toggleF10 = () => callHolyricsAPI('ToggleF10');

  return {
    callHolyricsAPI,
    openBible,
    closeBible,
    nextVerse,
    previousVerse,
    showImage,
    getCPInfo,
    getImages,
    showVerse,
    toggleF8,
    toggleF9,
    toggleF10,
  };
};
