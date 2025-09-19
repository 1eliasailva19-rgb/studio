"use client";

import { useState, useRef } from 'react';
import { Music, Upload, Loader2, Save, FolderDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type InstrumentTrack = {
  name: string;
  // In a real implementation, this would be audio data
  data: string | null;
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

    // Simulate AI processing
    setTimeout(() => {
      // This is mock data. A real implementation would call an AI service.
      const mockTracks: InstrumentTrack[] = [
        { name: 'Bateria', data: '#' },
        { name: 'Baixo', data: '#' },
        { name: 'Guitarra', data: '#' },
        { name: 'Vocal', data: '#' },
      ];
      setSeparatedTracks(mockTracks);
      setIsProcessing(false);
      toast({
        title: "Processamento Concluído",
        description: "Os instrumentos foram separados.",
      });
    }, 3000);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
            <CardDescription>Selecione um arquivo de áudio do seu computador para iniciar o processo.</CardDescription>
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
              {isProcessing ? 'Processando...' : 'Separar Instrumentos'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">2. Instrumentos Separados</CardTitle>
            <CardDescription>Aqui estão as faixas de instrumentos extraídas da sua música. Você pode salvá-las.</CardDescription>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-40 rounded-lg bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                <p className="mt-4 text-muted-foreground">Analisando e separando o áudio...</p>
              </div>
            ) : separatedTracks.length > 0 ? (
              <div className="space-y-4">
                {separatedTracks.map((track) => (
                  <div key={track.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FolderDown className="h-5 w-5 text-accent"/>
                      <span className="font-medium">{track.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 rounded-lg bg-muted/50 border-2 border-dashed">
                <Music className="h-8 w-8 text-muted-foreground"/>
                <p className="mt-4 text-muted-foreground text-center">As faixas separadas aparecerão aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
