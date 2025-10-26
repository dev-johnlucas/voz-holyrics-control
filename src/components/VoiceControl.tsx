import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHolyricsAPI } from "@/hooks/useHolyricsAPI";
import { parseBibleReferencePT } from "@/lib/bible";

interface VoiceControlProps {
  onCommand: (command: string) => void;
  isConnected?: boolean;
}

export const VoiceControl = ({ onCommand, isConnected = true }: VoiceControlProps) => {
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

  // Normaliza texto para comparação robusta (sem acentos)
  const normalizeText = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Conjuntos de palavras-chave para comandos básicos
  const commandMatchers = {
    open: [
      'abrir biblia', 'abrir a biblia', 'mostrar biblia', 'mostrar a biblia',
      'exibir biblia', 'exibir a biblia', 'abra biblia', 'abra a biblia',
      'abrir palavra', 'abrir a palavra', 'abrir escritura', 'abrir as escrituras'
    ],
    close: [
      'fechar biblia', 'fechar a biblia', 'ocultar biblia', 'ocultar a biblia',
      'esconder biblia', 'esconder a biblia', 'feche biblia', 'feche a biblia'
    ],
    next: [
      'proximo versiculo', 'proximo verso', 'proximo', 'avancar', 'avanca',
      'ir para o proximo', 'ir pro proximo'
    ],
    prev: [
      'versiculo anterior', 'voltar versiculo', 'anterior', 'voltar', 'retroceder',
      'verso anterior'
    ],
  } as const;

  const parseVerseReference = (text: string): string | null => {
    return parseBibleReferencePT(text);
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false; // Mudado para evitar comandos duplicados
      recognitionInstance.lang = 'pt-BR';
      recognitionInstance.maxAlternatives = 3; // Reduzido para melhor precisão

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
        // Use a melhor alternativa com maior confiança
        const alts: { transcript: string; confidence: number }[] = [];
        for (let i = 0; i < lastResult.length; i++) {
          alts.push({ transcript: lastResult[i].transcript, confidence: lastResult[i].confidence ?? 0 });
        }
        const best = alts.sort((a, b) => (b.confidence - a.confidence))[0] ?? { transcript: '', confidence: 0 };
        const transcriptRaw = best.transcript.toLowerCase().trim();
        const tNorm = normalizeText(transcriptRaw);

        if (lastResult.isFinal) {
          console.log('Comando de voz recebido:', transcriptRaw);

          // 1) Referência bíblica (aceita números por extenso via util)
          const verseReference = parseVerseReference(transcriptRaw);
          if (verseReference) {
            toast({ title: 'Referência bíblica reconhecida', description: `Abrindo ${verseReference}` });
            // Garantir que a Bíblia esteja aberta antes de enviar o versículo
            onCommand('abrir bíblia');
            setTimeout(() => onCommand(`verse:${verseReference}`), 250);
            return;
          }

          // 2) Imagens por voz (normaliza para bater independentemente de acentos)
          const matchedImage = imageNames.find((n) => tNorm.includes(normalizeText(n)));
          if (matchedImage || tNorm.includes('tema principal')) {
            const name = matchedImage ?? 'tema principal';
            toast({ title: 'Imagem reconhecida', description: `Exibindo "${name}"` });
            onCommand(`image:${name}`);
            return;
          }

          // 3) Comandos básicos (open/close/next/prev) com sinônimos + heurísticas
          const hasAny = (list: readonly string[]) => list.some((k) => tNorm.includes(k));

          // Heurística: mencionar "biblia" sem termos de fechamento => abrir
          if (tNorm.includes('biblia') && !tNorm.includes('fechar') && !tNorm.includes('ocultar')) {
            onCommand('abrir bíblia');
            toast({ title: 'Comando', description: 'Abrindo Bíblia' });
            return;
          }

          if (hasAny(commandMatchers.open)) {
            onCommand('abrir bíblia');
            toast({ title: 'Comando', description: 'Abrindo Bíblia' });
            return;
          }
          if (hasAny(commandMatchers.close)) {
            onCommand('fechar bíblia');
            toast({ title: 'Comando', description: 'Fechando Bíblia' });
            return;
          }
          if (hasAny(commandMatchers.next)) {
            onCommand('próximo versículo');
            toast({ title: 'Comando', description: 'Próximo versículo' });
            return;
          }
          if (hasAny(commandMatchers.prev)) {
            onCommand('versículo anterior');
            toast({ title: 'Comando', description: 'Versículo anterior' });
            return;
          }
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Erro de reconhecimento de voz:', event.error, event);
        
        if (event.error === 'no-speech') {
          // Silêncio: apenas reinicia se estivermos escutando
          if (listeningRef.current) {
            try {
              recognitionInstance.stop();
            } catch {}
            try {
              recognitionInstance.start();
            } catch {}
          }
          return;
        }
        
        if (event.error === 'aborted') {
          // Evento normal quando paramos manualmente
          return;
        }
        
        // Tratar erro "not-allowed" (permissão negada)
        if (event.error === 'not-allowed') {
          toast({ 
            title: "Permissão negada", 
            description: "Permita o acesso ao microfone nas configurações do navegador", 
            variant: "destructive" 
          });
          setIsListening(false);
          listeningRef.current = false;
          return;
        }
        
        // Outros erros
        const errorMessages: Record<string, string> = {
          'network': 'Erro de rede. Verifique sua conexão.',
          'audio-capture': 'Erro ao capturar áudio. Verifique seu microfone.',
          'service-not-allowed': 'Serviço de reconhecimento não permitido.'
        };
        
        const description = errorMessages[event.error] || `Erro: ${event.error}. Tente novamente.`;
        
        toast({ title: "Erro no reconhecimento de voz", description, variant: "destructive" });
        setIsListening(false);
        listeningRef.current = false;
      };

      setRecognition(recognitionInstance);

      // Precarregar nomes de imagens do Holyrics (apenas uma vez)
      getImages().then((res) => {
        const names = Array.isArray(res?.images)
          ? res.images.map((i: any) => (i.name || '').toLowerCase()).filter((x: string) => !!x)
          : [];
        setImageNames(names);
      }).catch((e) => {
        console.warn('Falha ao carregar imagens:', e);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = async () => {
    if (!recognition) {
      toast({ title: "Reconhecimento não suportado", description: "Use os botões de controle", variant: "destructive" });
      return;
    }

    if (!isConnected) {
      toast({ 
        title: "Sem conexão", 
        description: "Conecte-se ao Holyrics primeiro para usar comandos de voz",
        variant: "destructive" 
      });
      return;
    }

    if (isListening) {
      try { recognition.stop(); } catch {}
      setIsListening(false);
      listeningRef.current = false;
    } else {
      // Aquecer microfone para melhorar captação e pedir permissão
      try {
        await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
        });
      } catch (e) {
        toast({
          title: 'Sem acesso ao microfone',
          description: 'Conceda permissão ao microfone no navegador',
          variant: 'destructive'
        });
        return;
      }

      try { recognition.start(); } catch {}
      setIsListening(true);
      listeningRef.current = true;
      toast({ title: 'Escutando', description: 'Fale um comando como "Abrir Bíblia"' });
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