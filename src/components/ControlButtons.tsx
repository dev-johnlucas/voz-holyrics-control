import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, X, ChevronRight, ChevronLeft, Image } from "lucide-react";

interface ControlButtonsProps {
  onCommand: (command: string) => void;
  isConnected: boolean;
}

export const ControlButtons = ({ onCommand, isConnected }: ControlButtonsProps) => {
  const bibleControls = [
    { 
      label: "Abrir Bíblia", 
      command: "abrir bíblia", 
      icon: BookOpen,
      variant: "default" as const
    },
    { 
      label: "Fechar Bíblia", 
      command: "fechar bíblia", 
      icon: X,
      variant: "secondary" as const
    },
    { 
      label: "Próximo Versículo", 
      command: "próximo versículo", 
      icon: ChevronRight,
      variant: "default" as const
    },
    { 
      label: "Versículo Anterior", 
      command: "versículo anterior", 
      icon: ChevronLeft,
      variant: "default" as const
    },
  ];

  const imageControls = [
    { name: "Cruz", command: "cruz" },
    { name: "Pomba", command: "pomba" },
    { name: "Monte", command: "monte" },
    { name: "Igreja", command: "igreja" },
  ];

  const handleCommand = (command: string) => {
    if (!isConnected) return;
    onCommand(command);
  };

  return (
    <div className="space-y-6">
      {/* Bible Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Controles da Bíblia</h3>
        <div className="grid grid-cols-2 gap-3">
          {bibleControls.map(({ label, command, icon: Icon, variant }) => (
            <Button
              key={command}
              onClick={() => handleCommand(command)}
              disabled={!isConnected}
              variant={variant}
              size="lg"
              className="h-16 flex flex-col gap-2 transition-all duration-200 hover:scale-105"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Image Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Imagens Cadastradas</h3>
        <div className="grid grid-cols-2 gap-3">
          {imageControls.map(({ name, command }) => (
            <Button
              key={command}
              onClick={() => handleCommand(command)}
              disabled={!isConnected}
              variant="outline"
              size="lg"
              className="h-16 flex flex-col gap-2 transition-all duration-200 hover:scale-105 hover:bg-accent/20"
            >
              <Image className="w-5 h-5" />
              <span className="text-xs">{name}</span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};