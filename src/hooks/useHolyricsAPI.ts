import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loadConfig } from "@/types/holyrics-config";
import type { HolyricsConfig } from "@/types/holyrics-config";

export const useHolyricsAPI = () => {
  const { toast } = useToast();

  const getConfig = (): HolyricsConfig | null => {
    return loadConfig();
  };

  const callHolyricsAPI = async (action: string, data?: Record<string, any>) => {
    try {
      // Calling Holyrics API (details omitted for security)
      
      const config = getConfig();
      if (!config) {
        toast({
          title: "Configuração necessária",
          description: "Configure a conexão com o Holyrics primeiro",
          variant: "destructive",
        });
        return null;
      }

      // For local mode, try direct connection first
      if (config.mode === 'local' && config.localHost && config.localPort) {
        try {
          const normalizeBase = (host: string, port: number) => {
            let base = String(host).trim();
            if (!/^https?:\/\//i.test(base)) base = `http://${base}`;
            // remove trailing slashes
            base = base.replace(/\/+$/, '');
            // if base already has a port, don't append
            const hasPort = /:\\d+$/.test(new URL(base).host);
            if (!hasPort && port) {
              base = `${base}:${port}`;
            }
            return base;
          };

          const base = normalizeBase(config.localHost, config.localPort);
          const localUrl = `${base}/api/${action}?token=${encodeURIComponent(config.token)}`;

          await fetch(localUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            body: JSON.stringify(data || {}),
            mode: 'no-cors', // Required for localhost cross-origin requests
          });

          // With no-cors, we can't read the response, but if no error was thrown, assume success
          return { status: 'ok' };
        } catch (localError) {
          console.warn('Local connection failed, falling back to edge function:', localError);
        }
      }

      // Fallback to edge function (works for both modes)
      const { data: result, error } = await supabase.functions.invoke('holyrics-control', {
        body: { 
          action, 
          data,
          config // Pass config to edge function
        }
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
  const getImages = () => callHolyricsAPI('GetImages');
  
  // Funções adicionais baseadas na documentação oficial
  const showVerse = (reference: string) => callHolyricsAPI('ShowVerse', { references: reference });
  const toggleF8 = () => callHolyricsAPI('ToggleF8'); // Papel de parede
  const toggleF9 = () => callHolyricsAPI('ToggleF9'); // Tela vazia
  const toggleF10 = () => callHolyricsAPI('ToggleF10'); // Tela preta

  return {
    callHolyricsAPI,
    openBible,
    closeBible,
    nextVerse,
    previousVerse,
    showImage,
    showVerse,
    getCPInfo,
    getImages,
    toggleF8,
    toggleF9,
    toggleF10
  };
};