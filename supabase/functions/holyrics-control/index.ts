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
    const api_key = church?.api_key || Deno.env.get('HOLYRICS_API_KEY') || 'API_KEY';
    const token = church?.token || Deno.env.get('HOLYRICS_TOKEN') || 'd87EsX3MALpldAJr';
    
    // Construir URL baseado nas configurações da igreja
    let baseUrl = 'https://api.holyrics.com.br';
    if (church?.holyrics_ip && church.holyrics_ip !== 'localhost') {
      // Se especificado IP customizado, usar protocolo local
      const protocol = church.holyrics_ip.includes('localhost') || church.holyrics_ip.startsWith('192.168') || church.holyrics_ip.startsWith('10.') ? 'http' : 'https';
      baseUrl = `${protocol}://${church.holyrics_ip}:${church.holyrics_port || 8080}`;
    }
    
    const url = `${baseUrl}/send/${holyricsAction}`;
    console.log('Making request to:', url, 'with data:', requestData, 'for church:', church?.name);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': api_key,
        'token': token
      },
      body: JSON.stringify(requestData)
    });

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