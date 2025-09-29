import { useState, useEffect, useMemo } from "react";
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

  // Mapeamento de nomes de livros bíblicos em português
  const booksMap = useMemo<Record<string, string>>(() => ({
    // Antigo Testamento
    'gênesis': 'Gn', 'genesis': 'Gn',
    'êxodo': 'Ex', 'exodo': 'Ex',
    'levítico': 'Lv', 'levitico': 'Lv',
    'números': 'Nm', 'numeros': 'Nm',
    'deuteronômio': 'Dt', 'deuteronomio': 'Dt',
    'josué': 'Js', 'josue': 'Js',
    'juízes': 'Jz', 'juizes': 'Jz',
    'rute': 'Rt',
    '1 samuel': '1Sm', 'primeiro samuel': '1Sm', '1samuel': '1Sm',
    '2 samuel': '2Sm', 'segundo samuel': '2Sm', '2samuel': '2Sm',
    '1 reis': '1Rs', 'primeiro reis': '1Rs', '1reis': '1Rs',
    '2 reis': '2Rs', 'segundo reis': '2Rs', '2reis': '2Rs',
    '1 crônicas': '1Cr', 'primeiro cronicas': '1Cr', '1cronicas': '1Cr',
    '2 crônicas': '2Cr', 'segundo cronicas': '2Cr', '2cronicas': '2Cr',
    'esdras': 'Ed',
    'neemias': 'Ne',
    'ester': 'Et',
    'jó': 'Jó', 'jo': 'Jó',
    'salmos': 'Sl', 'salmo': 'Sl',
    'provérbios': 'Pv', 'proverbios': 'Pv',
    'eclesiastes': 'Ec',
    'cantares': 'Ct', 'cânticos': 'Ct',
    'isaías': 'Is', 'isaias': 'Is',
    'jeremias': 'Jr',
    'lamentações': 'Lm', 'lamentacoes': 'Lm',
    'ezequiel': 'Ez',
    'daniel': 'Dn',
    'oseias': 'Os',
    'joel': 'Jl',
    'amós': 'Am', 'amos': 'Am',
    'obadias': 'Ob',
    'jonas': 'Jn',
    'miqueias': 'Mq',
    'naum': 'Na',
    'habacuque': 'Hc',
    'sofonias': 'Sf',
    'ageu': 'Ag',
    'zacarias': 'Zc',
    'malaquias': 'Ml',
    
    // Novo Testamento
    'mateus': 'Mt',
    'marcos': 'Mc',
    'lucas': 'Lc',
    'joão': 'Jo', 'joao': 'Jo',
    'atos': 'At',
    'romanos': 'Rm',
    '1 coríntios': '1Co', 'primeiro corintios': '1Co', '1corintios': '1Co',
    '2 coríntios': '2Co', 'segundo corintios': '2Co', '2corintios': '2Co',
    'gálatas': 'Gl', 'galatas': 'Gl',
    'efésios': 'Ef', 'efesios': 'Ef',
    'filipenses': 'Fp',
    'colossenses': 'Cl',
    '1 tessalonicenses': '1Ts', 'primeiro tessalonicenses': '1Ts', '1tessalonicenses': '1Ts',
    '2 tessalonicenses': '2Ts', 'segundo tessalonicenses': '2Ts', '2tessalonicenses': '2Ts',
    '1 timóteo': '1Tm', 'primeiro timoteo': '1Tm', '1timoteo': '1Tm',
    '2 timóteo': '2Tm', 'segundo timoteo': '2Tm', '2timoteo': '2Tm',
    'tito': 'Tt',
    'filemom': 'Fm',
    'hebreus': 'Hb',
    'tiago': 'Tg',
    '1 pedro': '1Pe', 'primeiro pedro': '1Pe', '1pedro': '1Pe',
    '2 pedro': '2Pe', 'segundo pedro': '2Pe', '2pedro': '2Pe',
    '1 joão': '1Jo', 'primeiro joao': '1Jo', '1joao': '1Jo',
    '2 joão': '2Jo', 'segundo joao': '2Jo', '2joao': '2Jo',
    '3 joão': '3Jo', 'terceiro joao': '3Jo', '3joao': '3Jo',
    'judas': 'Jd',
    'apocalipse': 'Ap'
  }), []);

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
    // Regex para capturar referências bíblicas como "João 3:16", "1 Coríntios 13:4", etc.
    const versePattern = /(\d*\s*[a-záêôçõü]+)\s+(\d+)[\s:]+(\d+)/gi;
    const match = versePattern.exec(text);
    
    if (match) {
      const [, bookName, chapter, verse] = match;
      const normalizedBook = bookName.toLowerCase().trim().replace(/\s+/g, ' ');
      const abbreviation = booksMap[normalizedBook];
      
      if (abbreviation && chapter && verse) {
        return `${abbreviation} ${chapter}:${verse}`;
      }
    }
    
    return null;
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'pt-BR';
      
      // Configurações otimizadas para mesa de som
      recognitionInstance.maxAlternatives = 1;
      recognitionInstance.audioTrack = true;

      recognitionInstance.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.toLowerCase().trim();
          console.log('Comando de voz recebido:', transcript);

          // Verificar se é uma referência bíblica primeiro
          const verseReference = parseVerseReference(transcript);
          if (verseReference) {
            toast({
              title: "Referência bíblica reconhecida",
              description: `Abrindo ${verseReference}`,
            });
            onCommand(`verse:${verseReference}`);
            return;
          }

          // Verificar comandos básicos
          if (commands.some(cmd => transcript.includes(cmd))) {
            onCommand(transcript);
            toast({
              title: "Comando reconhecido",
              description: `"${transcript}"`,
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
  }, []);

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