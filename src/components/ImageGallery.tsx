import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHolyricsAPI } from "@/hooks/useHolyricsAPI";
import { useToast } from "@/hooks/use-toast";
import { Image, Loader2 } from "lucide-react";

interface HolyricsImage {
  name: string;
  path: string;
  type: string;
}

interface ImageGalleryProps {
  isConnected: boolean;
  onImageSelect: (imageName: string) => void;
}

export const ImageGallery = ({ isConnected, onImageSelect }: ImageGalleryProps) => {
  const [images, setImages] = useState<HolyricsImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { getImages } = useHolyricsAPI();
  const { toast } = useToast();

  const loadImages = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      const result = await getImages();
      if (result && result.images) {
        const imageList = result.images.filter((img: HolyricsImage) => 
          img.type.toLowerCase().includes('jpeg') || 
          img.type.toLowerCase().includes('jpg') || 
          img.type.toLowerCase().includes('png')
        );
        setImages(imageList);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar imagens do Holyrics",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isConnected) {
      loadImages();
    }
  }, [isConnected]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Image className="w-5 h-5" />
          Galeria Holyrics
        </h3>
        <Button 
          onClick={loadImages} 
          disabled={!isConnected || loading}
          size="sm"
          variant="outline"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Atualizar"
          )}
        </Button>
      </div>

      {!isConnected ? (
        <p className="text-muted-foreground text-center py-8">
          Conecte-se ao Holyrics para ver as imagens
        </p>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Carregando imagens...</span>
        </div>
      ) : images.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhuma imagem encontrada
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {images.map((image) => (
            <Button
              key={image.name}
              variant="outline"
              className="h-auto p-2 text-left"
              onClick={() => onImageSelect(image.name)}
            >
              <div className="truncate">
                <div className="font-medium text-sm">{image.name}</div>
                <div className="text-xs text-muted-foreground">{image.type}</div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};