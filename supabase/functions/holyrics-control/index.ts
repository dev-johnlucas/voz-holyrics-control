import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HolyricsConfig {
  mode: 'local' | 'web';
  localHost?: string;
  localPort?: number;
  token: string;
  apiKey?: string;
}

interface HolyricsRequest {
  action: string;
  data?: Record<string, any>;
  config?: HolyricsConfig;
}

serve(async (req) => {
  console.log('Holyrics control function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data = {}, config }: HolyricsRequest = await req.json();
    console.log('Action requested:', action);

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

    // Determine connection mode and build request
    let url: string;
    let headers: HeadersInit;

    if (config?.mode === 'local' && config.localHost && config.localPort) {
      // Local API mode
      url = `${config.localHost}:${config.localPort}/api/${holyricsAction}?token=${config.token}`;
      headers = {
        'Content-Type': 'application/json',
      };
      console.log('Using LOCAL API mode');
    } else if (config?.mode === 'web' && config.apiKey) {
      // Web Server API mode
      url = `https://api.holyrics.com.br/send/${holyricsAction}`;
      headers = {
        'Content-Type': 'application/json',
        'api_key': config.apiKey,
        'token': config.token,
      };
      console.log('Using WEB SERVER API mode');
    } else {
      // Fallback to env variables (legacy support)
      const api_key = Deno.env.get('HOLYRICS_API_KEY') || 'API_KEY';
      const token = Deno.env.get('HOLYRICS_TOKEN') || 'd87EsX3MALpldAJr';
      url = `https://api.holyrics.com.br/send/${holyricsAction}`;
      headers = {
        'Content-Type': 'application/json',
        'api_key': api_key,
        'token': token,
      };
      console.log('Using FALLBACK mode (env variables):', url);
    }

    // Making request

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    const result = await response.json();

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