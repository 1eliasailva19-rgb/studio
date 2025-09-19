"use client";

import { useState, useRef } from 'react';
import { Music, Upload, Loader2, Save, FolderDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { separateInstruments, InstrumentSeparationOutput } from '@/ai/flows/instrument-separation-flow';

type InstrumentTrack = {
  id: number;
  name: string;
  data: string | null;
  selected: boolean;
};

// Helper function to convert a File to a Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [separatedTracks, setSeparatedTracks] = useState<InstrumentTrack[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10 MB limit
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "Por favor, selecione um arquivo de áudio com menos de 10MB.",
        });
        return;
      }
      setSelectedFile(file);
      setSeparatedTracks([]);
    }
  };

  const handleProcessMusic = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Nenhum arquivo selecionado",
        description: "Por favor, carregue um arquivo de música primeiro.",
      });
      return;
    }

    setIsProcessing(true);
    setSeparatedTracks([]);

    try {
      const audioDataUri = await fileToDataUri(selectedFile);
      
      const result: InstrumentSeparationOutput = await separateInstruments({
        audioDataUri: audioDataUri,
      });

      const processedTracks: InstrumentTrack[] = result.tracks.map((track, index) => ({
        id: index + 1,
        name: track.name,
        data: track.audioDataUri,
        selected: false,
      }));

      setSeparatedTracks(processedTracks);
      toast({
        title: "Processamento Concluído",
        description: "Os instrumentos foram separados.",
      });
    } catch (error) {
      console.error("Error processing music:", error);
      toast({
        variant: "destructive",
        title: "Erro no Processamento",
        description: "Ocorreu um erro ao separar os instrumentos. Por favor, tente novamente.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleTrackSelectionChange = (trackId: number) => {
    setSeparatedTracks(prevTracks =>
      prevTracks.map(track =>
        track.id === trackId ? { ...track, selected: !track.selected } : track
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSeparatedTracks(prevTracks => 
      prevTracks.map(track => ({ ...track, selected: checked }))
    );
  };

  const handleSaveSelected = () => {
    const selectedTracks = separatedTracks.filter(track => track.selected);
    if (selectedTracks.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma faixa selecionada",
        description: "Selecione pelo menos uma faixa para salvar.",
      });
      return;
    }

    selectedTracks.forEach(track => {
      if (track.data) {
        const link = document.createElement('a');
        link.href = track.data;
        link.download = `${track.name}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });

    toast({
      title: "Download iniciado",
      description: `Salvando ${selectedTracks.map(t => t.name).join(', ')}.`,
    });
  };

  const allTracksSelected = separatedTracks.length > 0 && separatedTracks.every(track => track.selected);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl flex items-center justify-center mb-8">
        <Music className="h-8 w-8 text-primary" />
        <h1 className="ml-3 text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Separador de Instrumentos AI
        </h1>
      </header>
      
      <main className="w-full max-w-2xl flex flex-col gap-8">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">1. Carregar sua Música</span>
            </CardTitle>
            <CardDescription>Selecione um arquivo de áudio (até 10MB) para iniciar o processo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="music-file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="audio/*"
            />
            <Button onClick={handleUploadClick} variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {selectedFile ? `Arquivo: ${selectedFile.name}` : 'Escolher arquivo de áudio'}
            </Button>
            
            <Button onClick={handleProcessMusic} disabled={isProcessing || !selectedFile} className="w-full group">
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Music className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              )}
              {isProcessing ? 'Processando... (pode levar um minuto)' : 'Separar Instrumentos'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">2. Instrumentos Separados</CardTitle>
            <CardDescription>Selecione as faixas que deseja salvar.</CardDescription>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-40 rounded-lg bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                <p className="mt-4 text-muted-foreground">Analisando e separando o áudio...</p>
              </div>
            ) : separatedTracks.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center p-3 rounded-lg bg-muted/50 border-b border-border">
                  <Checkbox 
                    id="select-all" 
                    checked={allTracksSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                  <Label htmlFor="select-all" className="ml-3 font-medium flex-1">Selecionar Todos</Label>
                </div>
                <div className="space-y-2 pt-2">
                  {separatedTracks.map((track) => (
                    <div key={track.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          id={`track-${track.id}`} 
                          checked={track.selected}
                          onCheckedChange={() => handleTrackSelectionChange(track.id)}
                        />
                        <Label htmlFor={`track-${track.id}`} className="flex items-center gap-3 cursor-pointer">
                          <FolderDown className="h-5 w-5 text-accent"/>
                          <span className="font-medium">{track.name}</span>
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 rounded-lg bg-muted/50 border-2 border-dashed">
                <Music className="h-8 w-8 text-muted-foreground"/>
                <p className="mt-4 text-muted-foreground text-center">As faixas separadas aparecerão aqui.</p>
              </div>
            )}
          </CardContent>
          {separatedTracks.length > 0 && !isProcessing && (
            <CardFooter>
              <Button onClick={handleSaveSelected} disabled={!separatedTracks.some(t => t.selected)} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salvar Selecionados
              </Button>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}
