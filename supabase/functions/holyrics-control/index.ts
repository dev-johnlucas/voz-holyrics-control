import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

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
    // Validate JWT and get user ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Get user's Holyrics configuration from database
    const { data: configData, error: configError } = await supabase
      .from('user_holyrics_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !configData) {
      console.error('Config not found for user:', configError);
      return new Response(
        JSON.stringify({ error: 'Configuration not found. Please configure your Holyrics connection first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User config loaded:', configData.mode);

    const { action, data = {} }: HolyricsRequest = await req.json();
    console.log('Action requested:', action, 'by user:', user.id);

    // Mapear ações para o formato correto da API do Holyrics
    let holyricsAction = action;
    let requestData = data;

    switch (action) {
      case 'OpenBible':
        holyricsAction = 'ShowVerse';
        requestData = { references: 'João 3:16' };
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

    if (configData.mode === 'local' && configData.local_host && configData.local_port) {
      // Local API mode
      url = `${configData.local_host}:${configData.local_port}/api/${holyricsAction}?token=${configData.token}`;
      headers = {
        'Content-Type': 'application/json',
      };
      console.log('Using LOCAL API mode');
    } else if (configData.mode === 'web' && configData.api_key) {
      // Web Server API mode
      url = `https://api.holyrics.com.br/send/${holyricsAction}`;
      headers = {
        'Content-Type': 'application/json',
        'api_key': configData.api_key,
        'token': configData.token,
      };
      console.log('Using WEB SERVER API mode');
    } else {
      console.error('Invalid configuration mode');
      return new Response(
        JSON.stringify({ error: 'Invalid configuration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Making request to Holyrics API
    console.log('Calling Holyrics API:', holyricsAction);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    console.log('Holyrics API response status:', response.status);

    return new Response(
      JSON.stringify(result),
      { 
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error calling Holyrics API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to communicate with Holyrics API', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
