import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SetupConfig } from "@/components/SetupConfig";
import { loadConfig, saveConfig } from "@/types/holyrics-config";
import type { HolyricsConfig } from "@/types/holyrics-config";

const queryClient = new QueryClient();

const App = () => {
  const [config, setConfig] = useState<HolyricsConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsConfigured(false);
        return;
      }

      // Try to load config from database
      const { data: configData } = await supabase
        .from('user_holyrics_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (configData) {
        const loadedConfig: HolyricsConfig = {
          mode: configData.mode as 'local' | 'web',
          localHost: configData.local_host,
          localPort: configData.local_port,
          token: configData.token,
          apiKey: configData.api_key,
        };
        setConfig(loadedConfig);
        setIsConfigured(true);
      } else {
        // Fallback to localStorage
        const savedConfig = loadConfig();
        if (savedConfig) {
          setConfig(savedConfig);
          setIsConfigured(true);
        }
      }
    };

    checkAuth();
  }, []);

  const handleConfigComplete = (newConfig: HolyricsConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
    setIsConfigured(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!isConfigured ? (
            <SetupConfig 
              onConfigComplete={handleConfigComplete}
              initialConfig={config}
            />
          ) : (
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
