import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Volume2, Mic, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AudioConfig = () => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [sensitivity, setSensitivity] = useState([60]);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  // Monitorar nível de áudio
  useEffect(() => {
    let mediaRecorder: MediaRecorder | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;

    const startAudioMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: echoCancellation,
            noiseSuppression: noiseReduction,
            sampleRate: 44100,
            channelCount: 1
          }
        });

        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const updateAudioLevel = () => {
          if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const level = Math.round((average / 255) * 100);
            setAudioLevel(level);
          }
          if (isListening) {
            requestAnimationFrame(updateAudioLevel);
          }
        };

        updateAudioLevel();
      } catch (error) {
        console.error('Erro ao acessar microfone:', error);
        toast({
          title: "Erro de áudio",
          description: "Não foi possível acessar o microfone",
          variant: "destructive",
        });
      }
    };

    if (isListening) {
      startAudioMonitoring();
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isListening, echoCancellation, noiseReduction, toast]);

  const testAudio = () => {
    setIsListening(!isListening);
    toast({
      title: isListening ? "Teste finalizado" : "Teste iniciado",
      description: isListening ? "Monitoramento de áudio parado" : "Fale no microfone para testar",
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Configuração de Áudio</h3>
      </div>

      <div className="space-y-6">
        {/* Nível de áudio */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Nível de Entrada
            </Label>
            <span className="text-sm text-muted-foreground">{audioLevel}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>

        {/* Sensibilidade */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Volume2 className="w-4 h-4" />
            Sensibilidade ({sensitivity[0]}%)
          </Label>
          <Slider
            value={sensitivity}
            onValueChange={setSensitivity}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
        </div>

        {/* Configurações */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="noise-reduction">Redução de Ruído</Label>
            <Switch
              id="noise-reduction"
              checked={noiseReduction}
              onCheckedChange={setNoiseReduction}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="echo-cancellation">Cancelamento de Eco</Label>
            <Switch
              id="echo-cancellation"
              checked={echoCancellation}
              onCheckedChange={setEchoCancellation}
            />
          </div>
        </div>

        {/* Teste de áudio */}
        <Button 
          onClick={testAudio}
          variant={isListening ? "destructive" : "default"}
          className="w-full"
        >
          {isListening ? "Parar Teste" : "Testar Microfone"}
        </Button>

        {/* Dicas para mesa de som */}
        <div className="bg-muted/50 p-3 rounded-lg text-sm">
          <h4 className="font-medium mb-2">Dicas para Mesa de Som:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Use cabo P10 (mesa) → P2 (PC)</li>
            <li>• Volume da mesa: 70-80%</li>
            <li>• Entrada Line In no Windows</li>
            <li>• Nível ideal: 50-70%</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};