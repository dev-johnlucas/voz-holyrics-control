import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceControlProps {
  onCommand: (command: string) => void;
}

export const VoiceControl = ({ onCommand }: VoiceControlProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();

  const commands = [
    "abrir bíblia",
    "fechar bíblia",
    "próximo versículo",
    "versículo anterior",
    "cruz",
    "pomba",
    "monte",
    "igreja",
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'pt-BR';

      recognitionInstance.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const command = lastResult[0].transcript.toLowerCase().trim();
          
          if (commands.some(cmd => command.includes(cmd))) {
            onCommand(command);
            toast({
              title: "Comando reconhecido",
              description: `"${command}"`,
            });
          }
        }
      };

      recognitionInstance.onerror = () => {
        toast({
          title: "Erro no reconhecimento",
          description: "Tente novamente",
          variant: "destructive",
        });
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onCommand, toast]);

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Reconhecimento não suportado",
        description: "Use os botões de controle",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold">Controle por Voz</h3>
        
        <div className="relative">
          <Button
            onClick={toggleListening}
            size="lg"
            className={`w-16 h-16 rounded-full transition-all duration-300 ${
              isListening 
                ? 'bg-accent animate-voice-listening' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isListening ? (
              <Mic className="w-8 h-8" />
            ) : (
              <MicOff className="w-8 h-8" />
            )}
          </Button>
          
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse-ring"></div>
          )}
        </div>

        <div className="text-center">
          <p className={`text-sm transition-colors ${
            isListening ? 'text-accent' : 'text-muted-foreground'
          }`}>
            {isListening ? 'Escutando...' : 'Clique para ativar'}
          </p>
          
          <div className="mt-2 text-xs text-muted-foreground">
            Comandos disponíveis:
            <div className="mt-1 flex flex-wrap gap-1 justify-center">
              {commands.slice(0, 4).map(cmd => (
                <span key={cmd} className="bg-muted px-2 py-1 rounded text-xs">
                  "{cmd}"
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};