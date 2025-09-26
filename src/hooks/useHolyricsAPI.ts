import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useHolyricsAPI = () => {
  const { toast } = useToast();

  const callHolyricsAPI = async (action: string, data?: Record<string, any>) => {
    try {
      console.log('Calling Holyrics API:', action, data);
      
      const { data: result, error } = await supabase.functions.invoke('holyrics-control', {
        body: { action, data }
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: "Erro de comunicação",
          description: "Falha ao comunicar com o Holyrics",
          variant: "destructive",
        });
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error calling Holyrics API:', error);
      toast({
        title: "Erro",
        description: "Falha na requisição para o Holyrics",
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

  return {
    callHolyricsAPI,
    openBible,
    closeBible,
    nextVerse,
    previousVerse,
    showImage,
    getCPInfo
  };
};