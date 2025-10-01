import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, Wifi, Globe } from "lucide-react";
import type { HolyricsConfig, ConnectionMode } from "@/types/holyrics-config";

interface SetupConfigProps {
  onConfigComplete: (config: HolyricsConfig) => void;
  initialConfig?: HolyricsConfig | null;
}

export const SetupConfig = ({ onConfigComplete, initialConfig }: SetupConfigProps) => {
  const [mode, setMode] = useState<ConnectionMode>(initialConfig?.mode || 'local');
  const [localHost, setLocalHost] = useState(initialConfig?.localHost || 'http://localhost');
  const [localPort, setLocalPort] = useState(initialConfig?.localPort?.toString() || '8080');
  const [token, setToken] = useState(initialConfig?.token || '');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    if (mode === 'local' && (!localHost || !localPort || !token)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Host, Porta e Token",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'web' && (!apiKey || !token)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha API Key e Token",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);

    try {
      const config: HolyricsConfig = {
        mode,
        token,
        ...(mode === 'local' && {
          localHost,
          localPort: parseInt(localPort),
        }),
        ...(mode === 'web' && { apiKey }),
      };

      // Test connection with a simple GetCPInfo request
      const testUrl = mode === 'local' 
        ? `${localHost}:${localPort}/api/GetCPInfo?token=${token}`
        : 'https://api.holyrics.com.br/send/GetCPInfo';

      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(mode === 'web' && {
            'api_key': apiKey,
            'token': token,
          }),
        },
        body: JSON.stringify({}),
        ...(mode === 'local' && { mode: 'no-cors' }),
      };

      const response = await fetch(testUrl, options);
      
      // For local mode with no-cors, we can't read the response
      // So we assume success if no error was thrown
      if (mode === 'local' || response.ok) {
        toast({
          title: "Conexão estabelecida!",
          description: "Configuração salva com sucesso",
        });
        onConfigComplete(config);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Falha na conexão');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Falha na conexão",
        description: error instanceof Error ? error.message : "Verifique as configurações",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configuração do Holyrics</h1>
            <p className="text-muted-foreground mt-1">
              Configure a conexão com sua API do Holyrics
            </p>
          </div>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as ConnectionMode)} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              API Local
            </TabsTrigger>
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              API Server Web
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="localHost">Host / Endereço IP</Label>
              <Input
                id="localHost"
                placeholder="http://localhost ou http://192.168.1.x"
                value={localHost}
                onChange={(e) => setLocalHost(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: http://localhost ou http://192.168.1.100
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="localPort">Porta</Label>
              <Input
                id="localPort"
                placeholder="8080"
                type="number"
                value={localPort}
                onChange={(e) => setLocalPort(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Porta configurada no Holyrics (padrão: 8080)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="localToken">Token de Acesso</Label>
              <Input
                id="localToken"
                placeholder="Token da API Local"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Token criado em: Menu arquivo → Configurações → API Server → Gerenciar permissões
              </p>
            </div>
          </TabsContent>

          <TabsContent value="web" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="Sua API Key do Holyrics"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                API Key disponível em: Menu arquivo → Configurações → API Server
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webToken">Token de Acesso</Label>
              <Input
                id="webToken"
                placeholder="Token da API Server Web"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Token criado em: Menu arquivo → Configurações → API Server → Gerenciar permissões
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex gap-3">
          <Button
            onClick={testConnection}
            disabled={testing}
            className="flex-1"
            size="lg"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando conexão...
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 mr-2" />
                Testar e Conectar
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">ℹ️ Sobre os modos de conexão</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>API Local:</strong> Conexão direta na rede local (mais rápida)</li>
            <li>• <strong>API Server Web:</strong> Conexão pela internet (funciona remotamente)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
