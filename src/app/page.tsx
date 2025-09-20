
"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Loader2, Microscope, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { diagnoseExam, DiagnoseExamOutput } from '@/ai/flows/diagnose-exam-flow';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [symptoms, setSymptoms] = useState('');
  const [examFile, setExamFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DiagnoseExamOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && previewUrl && imageRef.current) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'red';
      }
    }
  }, [previewUrl]);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    }
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // Limite de 4MB
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "Por favor, selecione um arquivo de imagem com menos de 4MB.",
        });
        return;
      }
      setExamFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const getCombinedImageAsDataUri = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = canvasRef.current;
        const image = imageRef.current;

        if (!canvas || !image || !previewUrl) {
            return reject(new Error("Elementos necessários não estão prontos."));
        }

        const newCanvas = document.createElement('canvas');
        newCanvas.width = image.naturalWidth;
        newCanvas.height = image.naturalHeight;
        const ctx = newCanvas.getContext('2d');

        if (!ctx) {
            return reject(new Error("Não foi possível obter o contexto do canvas."));
        }

        // Desenha a imagem original
        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

        // Desenha as anotações do canvas de desenho
        ctx.drawImage(canvas, 0, 0, image.naturalWidth, image.naturalHeight);

        resolve(newCanvas.toDataURL(examFile?.type || 'image/jpeg'));
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examFile || !symptoms) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, envie uma imagem e descreva seus sintomas.",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const examPhotoDataUri = await getCombinedImageAsDataUri();
      const result = await diagnoseExam({ examPhotoDataUri, symptoms });
      setAnalysisResult(result);
    } catch (error) {
      console.error("Erro ao analisar o exame:", error);
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: "Não foi possível processar a análise. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 border-b flex items-center justify-center">
        <Microscope className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold ml-2">Assistente de Diagnóstico Médico com IA</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Paciente</CardTitle>
              <CardDescription>Envie uma foto do seu exame ou do problema e descreva seus sintomas. Use o mouse para circular ou marcar a área de interesse na imagem.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="exam-file" className="font-medium">Exame ou Foto do Problema</label>
                  <Input id="exam-file" type="file" accept="image/*" onChange={handleFileChange} className="file:text-primary-foreground" />
                  {previewUrl && (
                    <div className="mt-4 relative mx-auto w-full max-w-md">
                      <img 
                        ref={imageRef} 
                        src={previewUrl} 
                        alt="Pré-visualização" 
                        className="rounded-md w-full h-auto"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          if (canvasRef.current) {
                            canvasRef.current.width = img.clientWidth;
                            canvasRef.current.height = img.clientHeight;
                          }
                        }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full rounded-md cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="symptoms" className="font-medium">Sintomas</label>
                  <Textarea
                    id="symptoms"
                    placeholder="Ex: Tenho sentido dores de cabeça frequentes e tontura..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={5}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" disabled={isLoading || !examFile || !symptoms} className="w-full">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Bot className="h-5 w-5 mr-2" /> Analisar</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center">
            {isLoading && (
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="mt-4 text-muted-foreground">Analisando... Isso pode levar alguns instantes.</p>
              </div>
            )}
            {analysisResult && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Resultado da Análise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap">{analysisResult.analysis}</p>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      {analysisResult.disclaimer}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
            {!isLoading && !analysisResult && (
              <div className="text-center text-muted-foreground">
                <Microscope className="h-16 w-16 mx-auto" />
                <p className="mt-4">Os resultados da análise aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        <p>Criado por JOSÉ WELINSON BEZERRA DA SILVA</p>
      </footer>
    </div>
  );
}

    