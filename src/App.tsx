import { useState, useEffect } from "react";
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
    const savedConfig = loadConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      setIsConfigured(true);
    }
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
