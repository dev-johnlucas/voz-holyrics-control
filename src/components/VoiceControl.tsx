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
  const noSpeechCountRef = useRef(0);
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
      'abra sua biblia', 'abra a sua biblia',
      'abrir palavra', 'abrir a palavra', 'abrir escritura', 'abrir as escrituras'
    ],
    close: [
      'fechar biblia', 'fechar a biblia', 'ocultar biblia', 'ocultar a biblia',
      'esconder biblia', 'esconder a biblia', 'feche biblia', 'feche a biblia'
    ],
    next: [
      'proximo versiculo', 'proximo verso', 'proximo', 'avancar', 'avanca',
      'ir para o proximo', 'ir pro proximo', 'passa', 'passa versiculo',
      'passa verso', 'avanca versiculo', 'avanca verso', 'seguinte', 'vai'
    ],
    prev: [
      'versiculo anterior', 'voltar versiculo', 'anterior', 'voltar', 'retroceder',
      'verso anterior', 'volta', 'volta versiculo', 'volta verso',
      'retrocede versiculo', 'retrocede verso', 'antes'
    ],
  } as const;

  const parseVerseReference = (text: string): string | null => {
    return parseBibleReferencePT(text);
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true; // Habilita resultados intermediários para melhor sensibilidade
      recognitionInstance.maxAlternatives = 3; // Mantém algumas alternativas
      recognitionInstance.lang = 'pt-BR';
      recognitionInstance.onstart = () => {
        console.log('Reconhecimento iniciado');
        noSpeechCountRef.current = 0;
      };

      recognitionInstance.onend = () => {
        console.log('Reconhecimento encerrado');
        if (listeningRef.current) {
          try { recognitionInstance.start(); } catch (e) { console.warn('Falha ao reiniciar reconhecimento', e); }
        }
      };

      recognitionInstance.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        
        // Processa tanto resultados intermediários quanto finais para melhor responsividade
        const alts: { transcript: string; confidence: number }[] = [];
        for (let i = 0; i < lastResult.length; i++) {
          alts.push({ transcript: lastResult[i].transcript, confidence: lastResult[i].confidence ?? 0 });
        }
        const best = alts.sort((a, b) => (b.confidence - a.confidence))[0] ?? { transcript: '', confidence: 0 };
        const transcriptRaw = best.transcript.toLowerCase().trim();
        const tNorm = normalizeText(transcriptRaw);

        // Só processa comandos quando o resultado é final
        if (lastResult.isFinal) {
          console.log('Comando de voz recebido:', transcriptRaw);
          console.log('Texto normalizado:', tNorm);

          // 1) Comandos de navegação têm prioridade absoluta
          const hasAny = (list: readonly string[]) => list.some((k) => tNorm.includes(k));

          if (hasAny(commandMatchers.next)) {
            console.log('Comando detectado: próximo versículo');
            onCommand('próximo versículo');
            toast({ title: 'Comando', description: 'Próximo versículo' });
            return;
          }
          if (hasAny(commandMatchers.prev)) {
            console.log('Comando detectado: versículo anterior');
            onCommand('versículo anterior');
            toast({ title: 'Comando', description: 'Versículo anterior' });
            return;
          }

          // 2) Comandos básicos de abrir/fechar (antes de referências para evitar conflitos)
          if (hasAny(commandMatchers.open)) {
            console.log('Comando detectado: abrir bíblia');
            onCommand('abrir bíblia');
            toast({ title: 'Comando', description: 'Abrindo Bíblia' });
            return;
          }
          if (hasAny(commandMatchers.close)) {
            console.log('Comando detectado: fechar bíblia');
            onCommand('fechar bíblia');
            toast({ title: 'Comando', description: 'Fechando Bíblia' });
            return;
          }

          // 3) Referência bíblica - tenta o texto original E todas as alternativas
          let verseReference: string | null = null;
          
          // Tenta o melhor resultado primeiro
          verseReference = parseVerseReference(transcriptRaw);
          if (verseReference) {
            console.log('✅ Referência bíblica detectada:', verseReference, 'de:', transcriptRaw);
            toast({ title: 'Bíblia', description: `Abrindo ${verseReference}` });
            onCommand(`verse:${verseReference}`);
            return;
          }
          
          // Se não encontrou, tenta alternativas
          for (const alt of alts) {
            if (alt.transcript !== transcriptRaw) {
              verseReference = parseVerseReference(alt.transcript);
              if (verseReference) {
                console.log('✅ Referência bíblica detectada (alternativa):', verseReference, 'de:', alt.transcript);
                toast({ title: 'Bíblia', description: `Abrindo ${verseReference}` });
                onCommand(`verse:${verseReference}`);
                return;
              }
            }
          }

          // 4) Imagens por voz
          const matchedImage = imageNames.find((n) => tNorm.includes(normalizeText(n)));
          if (matchedImage || tNorm.includes('tema principal')) {
            const name = matchedImage ?? 'tema principal';
            console.log('Imagem detectada:', name);
            toast({ title: 'Imagem reconhecida', description: `Exibindo "${name}"` });
            onCommand(`image:${name}`);
            return;
          }

          // 5) Se nada foi reconhecido
          console.log('Nenhum comando reconhecido para:', transcriptRaw);
          toast({ 
            title: 'Não reconhecido', 
            description: `"${transcriptRaw}" - Tente: "próximo", "anterior" ou uma referência como "João 3 16"`,
            variant: 'destructive'
          });
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Erro de reconhecimento de voz:', event.error);
        
        if (event.error === 'no-speech') {
          // Silêncio detectado - não mostra erro constante, apenas reinicia
          if (listeningRef.current) {
            noSpeechCountRef.current += 1;
            try { recognitionInstance.abort(); } catch {}
            setTimeout(() => {
              try { 
                if (listeningRef.current) {
                  recognitionInstance.start();
                }
              } catch (e) {
                console.warn('Falha ao reiniciar após no-speech:', e);
              }
            }, 200);
            
            // Só alerta após muitas tentativas
            if (noSpeechCountRef.current === 8) {
              toast({ 
                title: 'Sem áudio detectado', 
                description: 'Fale mais próximo ao microfone. Comandos: "próximo", "anterior", "João 3 16"'
              });
              noSpeechCountRef.current = 0; // Reset counter
            }
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