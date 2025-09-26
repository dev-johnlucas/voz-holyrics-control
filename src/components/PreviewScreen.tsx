import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PreviewScreenProps {
  currentDisplay: string;
  isConnected: boolean;
}

export const PreviewScreen = ({ currentDisplay, isConnected }: PreviewScreenProps) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [currentDisplay]);

  const renderPreviewContent = () => {
    if (!isConnected) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-offline/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-offline rounded-full"></div>
            </div>
            <p>Holyrics Desconectado</p>
          </div>
        </div>
      );
    }

    if (currentDisplay.includes("bíblia")) {
      return (
        <div className="h-full bg-gradient-to-b from-primary/10 to-background p-8 flex items-center justify-center">
          <div className="text-center text-foreground">
            <h2 className="text-4xl font-bold mb-4">João 3:16</h2>
            <p className="text-xl leading-relaxed max-w-2xl">
              "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, 
              para que todo aquele que nele crê não pereça, mas tenha a vida eterna."
            </p>
          </div>
        </div>
      );
    }

    if (currentDisplay.includes("imagem")) {
      const imageName = currentDisplay.replace("exibindo imagem: ", "");
      return (
        <div className="h-full bg-gradient-to-br from-accent/20 to-background p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-accent/30 rounded-lg flex items-center justify-center">
              <span className="text-4xl">🖼️</span>
            </div>
            <h3 className="text-2xl font-semibold capitalize">{imageName}</h3>
            <p className="text-muted-foreground mt-2">Imagem em exibição</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-gradient-to-br from-muted/20 to-background p-8 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-24 h-24 mx-auto mb-4 bg-muted/30 rounded-lg flex items-center justify-center">
            <span className="text-5xl">📺</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Tela em Standby</h3>
          <p>Aguardando próximo comando</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="flex-1 overflow-hidden">
      <div className="p-4 border-b bg-card/50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Preview - Holyrics</h2>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="aspect-video bg-background border-2 border-dashed border-border/50">
        {renderPreviewContent()}
      </div>
    </Card>
  );
};