import { useState } from "react";
import { VoiceControl } from "./VoiceControl";
import { PreviewScreen } from "./PreviewScreen";
import { ControlButtons } from "./ControlButtons";
import { ConnectionStatus } from "./ConnectionStatus";
import { useToast } from "@/hooks/use-toast";

export const HolyricsDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState("standby");
  const [lastCommand, setLastCommand] = useState("");
  const { toast } = useToast();

  const handleCommand = (command: string) => {
    if (!isConnected) {
      toast({
        title: "Sem conexão",
        description: "Conecte-se ao Holyrics primeiro",
        variant: "destructive",
      });
      return;
    }

    setLastCommand(command);

    // Simulate API calls to Holyrics
    if (command.includes("abrir bíblia")) {
      setCurrentDisplay("bíblia aberta");
      toast({
        title: "Comando executado",
        description: "Bíblia aberta no Holyrics",
      });
    } else if (command.includes("fechar bíblia")) {
      setCurrentDisplay("standby");
      toast({
        title: "Comando executado",
        description: "Bíblia fechada",
      });
    } else if (command.includes("próximo versículo")) {
      setCurrentDisplay("bíblia aberta - próximo versículo");
      toast({
        title: "Comando executado",
        description: "Próximo versículo exibido",
      });
    } else if (command.includes("versículo anterior")) {
      setCurrentDisplay("bíblia aberta - versículo anterior");
      toast({
        title: "Comando executado",
        description: "Versículo anterior exibido",
      });
    } else if (["cruz", "pomba", "monte", "igreja"].some(img => command.includes(img))) {
      const imageName = ["cruz", "pomba", "monte", "igreja"].find(img => command.includes(img));
      setCurrentDisplay(`exibindo imagem: ${imageName}`);
      toast({
        title: "Comando executado",
        description: `Imagem "${imageName}" exibida`,
      });
    }
  };

  const toggleConnection = () => {
    setIsConnected(!isConnected);
    if (!isConnected) {
      setCurrentDisplay("standby");
    } else {
      setCurrentDisplay("desconectado");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Controle por Voz - Holyrics
          </h1>
          <p className="text-muted-foreground mt-2">
            Dashboard de controle com pré-visualização em tempo real
          </p>
        </div>

        {/* Connection Status */}
        <ConnectionStatus 
          isConnected={isConnected}
          onToggleConnection={toggleConnection}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Screen - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <PreviewScreen 
              currentDisplay={currentDisplay}
              isConnected={isConnected}
            />
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-6">
            <VoiceControl onCommand={handleCommand} />
            <ControlButtons 
              onCommand={handleCommand}
              isConnected={isConnected}
            />
          </div>
        </div>

        {/* Last Command Info */}
        {lastCommand && (
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Último comando:</span>
              <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                "{lastCommand}"
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};