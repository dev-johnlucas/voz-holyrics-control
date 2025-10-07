import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { HolyricsConfig } from "@/types/holyrics-config";

interface SetupConfigProps {
  onConfigComplete: (config: HolyricsConfig) => void;
  initialConfig?: HolyricsConfig | null;
}

export const SetupConfig = ({ onConfigComplete, initialConfig }: SetupConfigProps) => {
  const [mode, setMode] = useState<'local' | 'web'>(initialConfig?.mode || 'web');
  const [localHost, setLocalHost] = useState(initialConfig?.localHost || 'http://localhost');
  const [localPort, setLocalPort] = useState(initialConfig?.localPort?.toString() || '8080');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [token, setToken] = useState(initialConfig?.token || '');
  const [isTesting, setIsTesting] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleAuth = async (isSignUp: boolean) => {
    try {
      setIsTesting(true);
      
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar o cadastro.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Login realizado!",
          description: "Agora você pode configurar sua conexão.",
        });
        
        setNeedsAuth(false);
      }
    } catch (error: any) {
      toast({
        title: "Erro na autenticação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testConnection = async () => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setNeedsAuth(true);
      toast({
        title: "Autenticação necessária",
        description: "Por favor, faça login ou crie uma conta para continuar.",
        variant: "destructive",
      });
      return;
    }

    // Validar campos
    if (!token) {
      toast({
        title: "Token obrigatório",
        description: "Por favor, preencha o token",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'web' && !apiKey) {
      toast({
        title: "API Key obrigatória",
        description: "Por favor, preencha a API Key para o modo Web",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'local' && (!localHost || !localPort)) {
      toast({
        title: "Host e Porta obrigatórios",
        description: "Por favor, preencha o host e porta para o modo Local",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      const config: HolyricsConfig = {
        mode,
        localHost: mode === 'local' ? localHost : undefined,
        localPort: mode === 'local' ? parseInt(localPort) : undefined,
        token,
        apiKey: mode === 'web' ? apiKey : undefined,
      };

      // Save config to database
      const { error: upsertError } = await supabase
        .from('user_holyrics_configs')
        .upsert({
          user_id: user.id,
          mode: config.mode,
          local_host: config.localHost,
          local_port: config.localPort,
          token: config.token,
          api_key: config.apiKey,
        });

      if (upsertError) {
        console.error('Error saving config:', upsertError);
        throw new Error('Falha ao salvar configuração: ' + upsertError.message);
      }

      // Test connection
      const { data, error } = await supabase.functions.invoke('holyrics-control', {
        body: { 
          action: 'GetCPInfo',
          data: {}
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao conectar');
      }

      if (data?.status === 'error') {
        throw new Error(data.error?.message || 'Erro desconhecido do Holyrics');
      }

      toast({
        title: "Conexão estabelecida!",
        description: "Configuração salva com sucesso",
      });

      onConfigComplete(config);
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast({
        title: "Falha na conexão",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (needsAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Autenticação</CardTitle>
            <CardDescription>
              {isSigningUp ? 'Crie sua conta' : 'Entre com sua conta'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAuth(isSigningUp)} 
                disabled={isTesting}
                className="flex-1"
              >
                {isTesting ? "Processando..." : isSigningUp ? "Criar Conta" : "Entrar"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsSigningUp(!isSigningUp)}
                className="flex-1"
              >
                {isSigningUp ? "Já tenho conta" : "Criar conta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Configuração do Holyrics</CardTitle>
          <CardDescription>
            Configure a conexão com o Holyrics. Escolha entre API Local ou API Server Web.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'local' | 'web')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">API Local</TabsTrigger>
              <TabsTrigger value="web">API Server Web</TabsTrigger>
            </TabsList>

            <TabsContent value="local" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="localHost">Host</Label>
                <Input
                  id="localHost"
                  placeholder="http://localhost"
                  value={localHost}
                  onChange={(e) => setLocalHost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localPort">Porta</Label>
                <Input
                  id="localPort"
                  placeholder="8080"
                  value={localPort}
                  onChange={(e) => setLocalPort(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localToken">Token</Label>
                <Input
                  id="localToken"
                  placeholder="Seu token do Holyrics"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="web" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  placeholder="Sua API Key do Holyrics"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webToken">Token</Label>
                <Input
                  id="webToken"
                  placeholder="Seu token do Holyrics"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            onClick={testConnection} 
            disabled={isTesting}
            className="w-full mt-6"
          >
            {isTesting ? "Testando conexão..." : "Testar e Conectar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
