import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HolyricsRequest {
  action: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  console.log('Holyrics control function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data = {} }: HolyricsRequest = await req.json();
    console.log('Action requested:', action, 'Data:', data);

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
      case 'GetCPInfo':
        holyricsAction = 'GetCPInfo';
        requestData = {};
        break;
    }

    const api_key = Deno.env.get('HOLYRICS_API_KEY') || 'API_KEY';
    const token = Deno.env.get('HOLYRICS_TOKEN') || 'd87EsX3MALpldAJr';
    
    const url = `https://api.holyrics.com.br/send/${holyricsAction}`;
    console.log('Making request to:', url, 'with data:', requestData);

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