import { useState } from "react";
import { VoiceControl } from "./VoiceControl";
import { PreviewScreen } from "./PreviewScreen";
import { ControlButtons } from "./ControlButtons";
import { ConnectionStatus } from "./ConnectionStatus";
import { ImageGallery } from "./ImageGallery";
import { AudioConfig } from "./AudioConfig";
import { useToast } from "@/hooks/use-toast";
import { useHolyricsAPI } from "@/hooks/useHolyricsAPI";

export const HolyricsDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState("standby");
  const [lastCommand, setLastCommand] = useState("");
  const { toast } = useToast();
  const { openBible, closeBible, nextVerse, previousVerse, showImage, showVerse, getCPInfo } = useHolyricsAPI();

  const handleImageSelect = async (imageName: string) => {
    const result = await showImage(imageName);
    if (result) {
      setCurrentDisplay(`exibindo imagem: ${imageName}`);
      toast({
        title: "Imagem exibida",
        description: `"${imageName}" está sendo exibida`,
      });
    }
  };

  const handleCommand = async (command: string) => {
    if (!isConnected) {
      toast({
        title: "Sem conexão",
        description: "Conecte-se ao Holyrics primeiro",
        variant: "destructive",
      });
      return;
    }

    setLastCommand(command);

    try {
      // Verificar se é um comando de versículo específico
      if (command.startsWith('verse:')) {
        const reference = command.replace('verse:', '');
        const result = await showVerse(reference);
        if (result) {
          setCurrentDisplay(`Bíblia - ${reference}`);
          toast({
            title: "Comando executado",
            description: `Abrindo ${reference}`,
          });
        }
        return;
      }

      // Comandos básicos
      if (command.includes("abrir bíblia")) {
        const result = await openBible();
        if (result) {
          setCurrentDisplay("bíblia aberta");
          toast({
            title: "Comando executado",
            description: "Bíblia aberta no Holyrics",
          });
        }
      } else if (command.includes("fechar bíblia")) {
        const result = await closeBible();
        if (result) {
          // Mostrar tema principal após fechar bíblia
          await showImage("tema principal");
          setCurrentDisplay("tema principal");
          toast({
            title: "Comando executado",
            description: "Bíblia fechada - Tema principal exibido",
          });
        }
      } else if (command.includes("próximo versículo")) {
        const result = await nextVerse();
        if (result) {
          setCurrentDisplay("bíblia aberta - próximo versículo");
          toast({
            title: "Comando executado",
            description: "Próximo versículo exibido",
          });
        }
      } else if (command.includes("versículo anterior")) {
        const result = await previousVerse();
        if (result) {
          setCurrentDisplay("bíblia aberta - versículo anterior");
          toast({
            title: "Comando executado",
            description: "Versículo anterior exibido",
          });
        }
      } else if (["cruz", "pomba", "monte", "igreja"].some(img => command.includes(img))) {
        const imageName = ["cruz", "pomba", "monte", "igreja"].find(img => command.includes(img));
        if (imageName) {
          const result = await showImage(imageName);
          if (result) {
            setCurrentDisplay(`exibindo imagem: ${imageName}`);
            toast({
              title: "Comando executado",
              description: `Imagem "${imageName}" exibida`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao executar comando:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar comando",
        variant: "destructive",
      });
    }
  };

  const toggleConnection = async () => {
    if (!isConnected) {
      // Test connection with Holyrics
      const result = await getCPInfo();
      if (result) {
        setIsConnected(true);
        setCurrentDisplay("standby");
        toast({
          title: "Conectado",
          description: "Conectado com sucesso ao Holyrics",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: "Não foi possível conectar ao Holyrics",
          variant: "destructive",
        });
      }
    } else {
      setIsConnected(false);
      setCurrentDisplay("desconectado");
      toast({
        title: "Desconectado",
        description: "Desconectado do Holyrics",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Holy Voice
          </h1>
          <p className="text-muted-foreground mt-2">
            Controle Inteligente para Holyrics - Comando por Voz Profissional
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
            <ImageGallery 
              isConnected={isConnected}
              onImageSelect={handleImageSelect}
            />
            <AudioConfig />
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