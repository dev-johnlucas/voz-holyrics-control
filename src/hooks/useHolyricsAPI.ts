import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useHolyricsAPI = (selectedChurch?: any) => {
  const { toast } = useToast();

  // Detect if IP/host is local or private (LAN) -> browser can reach it, Edge Function cannot
  const isLocalOrPrivate = (host?: string) => {
    if (!host) return true;
    const h = host.toLowerCase();
    if (h === 'localhost' || h === '::1' || h.startsWith('127.')) return true;
    if (h.startsWith('10.')) return true;
    if (h.startsWith('192.168.')) return true;
    const match172 = h.match(/^172\.(\d+)\./);
    if (match172) {
      const n = Number(match172[1]);
      if (n >= 16 && n <= 31) return true;
    }
    return false;
  };

  // Map high-level actions to Holyrics API actions + payload (mirror of Edge Function mapping)
  const mapAction = (action: string, data: Record<string, any> = {}) => {
    let holyricsAction = action;
    let payload: Record<string, any> = data || {};
    switch (action) {
      case 'OpenBible':
        holyricsAction = 'ShowVerse';
        payload = { references: 'João 3:16' };
        break;
      case 'CloseBible':
        holyricsAction = 'CloseCurrentPresentation';
        payload = {};
        break;
      case 'NextVerse':
        holyricsAction = 'ActionNext';
        payload = {};
        break;
      case 'PreviousVerse':
        holyricsAction = 'ActionPrevious';
        payload = {};
        break;
      case 'ShowImage':
        holyricsAction = 'ShowImage';
        payload = { file: data.name || 'default.jpg' };
        break;
      case 'ShowVerse':
        holyricsAction = 'ShowVerse';
        payload = { references: data.references || 'João 3:16' };
        break;
      case 'GetCPInfo':
        holyricsAction = 'GetCPInfo';
        payload = {};
        break;
      case 'GetImages':
        holyricsAction = 'GetImages';
        payload = {};
        break;
      default:
        // Leave as-is
        break;
    }
    return { holyricsAction, payload };
  };

  // Build direct base for local mode
  const resolveDirectBase = () => {
    const ip = selectedChurch?.holyrics_ip || 'localhost';
    const port = selectedChurch?.holyrics_port ?? 8091; // Default commonly used for Holyrics local
    return `http://${ip}:${port}`;
  };

  // Attempt direct browser call (works for localhost/LAN). Uses no-cors to bypass CORS limitations.
  const attemptDirect = async (action: string, data?: Record<string, any>) => {
    const { holyricsAction, payload } = mapAction(action, data);
    const base = resolveDirectBase();

    const qs = new URLSearchParams();
    if (selectedChurch?.api_key) qs.set('api_key', selectedChurch.api_key);
    if (selectedChurch?.token) qs.set('token', selectedChurch.token);

    const candidates = [
      `${base}/api/control/send/${holyricsAction}`,
      `${base}/send/${holyricsAction}`,
    ];

    for (const u of candidates) {
      try {
        const url = qs.toString() ? `${u}?${qs.toString()}` : u;
        // no-cors makes the response opaque, but resolves if network succeeds -> good for fire-and-forget commands
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
        });
        return { ok: true };
      } catch (e) {
        console.warn('Direct Holyrics call failed:', u, e);
      }
    }
    return null;
  };

  const callHolyricsAPI = async (action: string, data?: Record<string, any>) => {
    try {
      console.log('Calling Holyrics API:', action, data);

      // Use direct mode when target is local/private or when no church is selected (assume local default)
      const directMode = isLocalOrPrivate(selectedChurch?.holyrics_ip) || !selectedChurch;
      if (directMode) {
        const res = await attemptDirect(action, data);
        if (res) return res;
        // If direct attempt fails, notify and continue to try Edge (in case user configured a public base there)
        console.warn('Direct mode failed, trying Edge Function fallback...');
      }
      
      const { data: result, error } = await supabase.functions.invoke('holyrics-control', {
        body: {
          action,
          data,
          church: selectedChurch || null,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: 'Erro de comunicação',
          description: 'Falha ao comunicar com o Holyrics',
          variant: 'destructive',
        });
        return null;
      }

      return result ?? { ok: true };
    } catch (error) {
      console.error('Error calling Holyrics API:', error);
      toast({
        title: 'Erro',
        description: 'Falha na requisição para o Holyrics',
        variant: 'destructive',
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