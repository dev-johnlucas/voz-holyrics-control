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

    const holyrics_api_base = 'https://api.holyrics.com.br/send';
    const token = 'd87EsX3MALpldAJr';
    
    const url = holyrics_api_base;
    console.log('Making request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': 'API_KEY',
        'token': token
      },
      body: JSON.stringify({ action, ...data })
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