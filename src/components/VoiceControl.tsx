import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHolyricsAPI } from "@/hooks/useHolyricsAPI";
import { parseBibleReferencePT } from "@/lib/bible";

interface VoiceControlProps {
  onCommand: (command: string) => void;
}

export const VoiceControl = ({ onCommand }: VoiceControlProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const listeningRef = useRef(false);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const { toast } = useToast();
  const { getImages } = useHolyricsAPI();

  // Referências bíblicas: usar util em src/lib/bible.ts

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

  const parseVerseReference = (text: string): string | null => {
    return parseBibleReferencePT(text);
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'pt-BR';
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onstart = () => {
        console.log('Reconhecimento iniciado');
      };

      recognitionInstance.onend = () => {
        console.log('Reconhecimento encerrado');
        if (listeningRef.current) {
          try { recognitionInstance.start(); } catch (e) { console.warn('Falha ao reiniciar reconhecimento', e); }
        }
      };

      recognitionInstance.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.toLowerCase().trim();
          console.log('Comando de voz recebido:', transcript);

          // 1) Referência bíblica
          const verseReference = parseVerseReference(transcript);
          if (verseReference) {
            toast({
              title: "Referência bíblica reconhecida",
              description: `Abrindo ${verseReference}`,
            });
            onCommand(`verse:${verseReference}`);
            return;
          }

          // 2) Imagens por voz (inclui "tema principal")
          const t = transcript;
          const matchedImage = imageNames.find((n) => t.includes(n));
          if (matchedImage || t.includes('tema principal')) {
            const name = matchedImage ?? 'tema principal';
            toast({ title: 'Imagem reconhecida', description: `Exibindo "${name}"` });
            onCommand(`image:${name}`);
            return;
          }

          // 3) Comandos básicos
          if (commands.some(cmd => transcript.includes(cmd))) {
            onCommand(transcript);
            toast({ title: "Comando reconhecido", description: `"${transcript}"` });
          }
        }
      };

      recognitionInstance.onerror = () => {
        toast({ title: "Erro no reconhecimento", description: "Tente novamente", variant: "destructive" });
        setIsListening(false);
        listeningRef.current = false;
      };

      setRecognition(recognitionInstance);

      // Precarregar nomes de imagens do Holyrics
      (async () => {
        try {
          const res = await getImages();
          const names = Array.isArray(res?.images)
            ? res.images.map((i: any) => (i.name || '').toLowerCase()).filter((x: string) => !!x)
            : [];
          setImageNames(names);
        } catch (e) {
          console.warn('Falha ao carregar imagens:', e);
        }
      })();
    }
  }, [getImages, onCommand, toast]);

  const toggleListening = () => {
    if (!recognition) {
      toast({ title: "Reconhecimento não suportado", description: "Use os botões de controle", variant: "destructive" });
      return;
    }

    if (isListening) {
      try { recognition.stop(); } catch {}
      setIsListening(false);
      listeningRef.current = false;
    } else {
      try { recognition.start(); } catch {}
      setIsListening(true);
      listeningRef.current = true;
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
            <div className="mt-2 text-xs text-muted-foreground">
              Ou diga uma referência bíblica como:
              <div className="mt-1 flex flex-wrap gap-1 justify-center">
                <span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs">
                  "João 3 16"
                </span>
                <span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs">
                  "Salmos 23 1"
                </span>
                <span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs">
                  "Amós 1 1"
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};