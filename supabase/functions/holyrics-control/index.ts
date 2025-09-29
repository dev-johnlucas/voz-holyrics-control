import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HolyricsRequest {
  action: string;
  data?: Record<string, any>;
  church?: {
    id: string;
    name: string;
    holyrics_ip: string;
    holyrics_port: number;
    api_key?: string;
    token?: string;
  };
}

serve(async (req) => {
  console.log('Holyrics control function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data = {}, church }: HolyricsRequest = await req.json();
    console.log('Action requested:', action, 'Data:', data, 'Church:', church?.name);

    // Mapear ações para o formato correto da API do Holyrics
    let holyricsAction = action;
    let requestData = data;

    switch (action) {
      case 'OpenBible':
        holyricsAction = 'ShowVerse';
        requestData = { references: 'João 3:16' }; // Versículo padrão
        break;
      case 'CloseBible':
        holyricsAction = 'CloseCurrentPresentation';
        requestData = {};
        break;
      case 'NextVerse':
        holyricsAction = 'ActionNext';
        requestData = {};
        break;
      case 'PreviousVerse':
        holyricsAction = 'ActionPrevious';
        requestData = {};
        break;
      case 'ShowImage':
        holyricsAction = 'ShowImage';
        requestData = { file: data.name || 'default.jpg' };
        break;
      case 'ShowVerse':
        holyricsAction = 'ShowVerse';
        requestData = { references: data.references || 'João 3:16' };
        break;
      case 'GetCPInfo':
        holyricsAction = 'GetCPInfo';
        requestData = {};
        break;
      case 'GetImages':
        holyricsAction = 'GetImages';
        requestData = {};
        break;
    }

    // Usar configurações específicas da igreja se fornecidas, caso contrário usar fallback
    const api_key = church?.api_key || Deno.env.get('HOLYRICS_API_KEY') || '';
    const token = church?.token || Deno.env.get('HOLYRICS_TOKEN') || '';
    
    // Base URL: prioridade para HOLYRICS_API_BASE (se definido), depois IP/porta da igreja, depois localhost
    const secretBase = Deno.env.get('HOLYRICS_API_BASE');
    const baseUrl = (secretBase && secretBase.trim())
      || (church?.holyrics_ip ? `http://${church.holyrics_ip}:${church.holyrics_port || 8080}` : 'http://localhost:8080');
    
    // Candidatos de endpoint (variações existentes na API)
    const candidates = [
      `${baseUrl}/api/control/send/${holyricsAction}`,
      `${baseUrl}/send/${holyricsAction}`,
    ];

    // Anexar autenticação também via querystring para máxima compatibilidade
    const qs = new URLSearchParams();
    if (api_key) qs.set('api_key', api_key);
    if (token) qs.set('token', token);

    console.log('Holyrics base:', baseUrl, 'action:', holyricsAction, 'data:', requestData, 'church:', church?.name);

    // Helper com timeout para evitar travas
    const withTimeout = async (url: string) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(qs.toString() ? `${url}?${qs.toString()}` : url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_key': api_key,
            'token': token,
          },
          body: JSON.stringify(requestData),
          signal: controller.signal,
        });
        return res;
      } finally {
        clearTimeout(id);
      }
    };

    // Tenta o endpoint principal e depois o fallback
    let response: Response | null = null;
    let lastError: unknown = null;
    for (const u of candidates) {
      try {
        console.log('Trying Holyrics endpoint:', u);
        const res = await withTimeout(u);
        if (res.ok) {
          response = res;
          break;
        } else {
          console.warn('Holyrics endpoint responded non-OK', u, res.status);
          lastError = new Error(`Status ${res.status}`);
        }
      } catch (e) {
        console.warn('Holyrics endpoint failed', u, e);
        lastError = e;
      }
    }

    if (!response) {
      throw lastError || new Error('No Holyrics endpoint reachable');
    }

    const result = await response.json();
    console.log('Holyrics API response:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error calling Holyrics API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to communicate with Holyrics API' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});