import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectionStatusProps {
  isConnected: boolean;
  onToggleConnection: () => void;
  churchName?: string;
}

export const ConnectionStatus = ({ isConnected, onToggleConnection, churchName }: ConnectionStatusProps) => {
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setLastPing(new Date());
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const handleToggleConnection = () => {
    onToggleConnection();
    
    if (!isConnected) {
      toast({
        title: "Conectando ao Holyrics...",
        description: "Tentando estabelecer conexão",
      });
    } else {
      toast({
        title: "Desconectado",
        description: "Conexão com Holyrics encerrada",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            isConnected ? 'bg-live/20' : 'bg-offline/20'
          }`}>
            {isConnected ? (
              <Wifi className="w-5 h-5 text-live" />
            ) : (
              <WifiOff className="w-5 h-5 text-offline" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {churchName ? `${churchName} - Holyrics` : "Holyrics API"}
              </span>
              <Badge 
                variant={isConnected ? "default" : "destructive"}
                className={isConnected ? "bg-live text-black" : ""}
              >
                {isConnected ? "Online" : "Offline"}
              </Badge>
            </div>
            
            {isConnected && lastPing && (
              <p className="text-xs text-muted-foreground">
                Último ping: {lastPing.toLocaleTimeString()}
              </p>
            )}
            
            {!isConnected && (
              <p className="text-xs text-muted-foreground">
                {churchName ? `${churchName} - Aguardando conexão` : "Aguardando conexão"}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleToggleConnection}
          variant={isConnected ? "destructive" : "default"}
          size="sm"
          className="min-w-[100px]"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {isConnected ? "Desconectar" : "Conectar"}
        </Button>
      </div>
    </Card>
  );
};