
"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Loader2, Microscope, AlertTriangle, Upload, Pencil, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { diagnoseExam, DiagnoseExamOutput } from '@/ai/flows/diagnose-exam-flow';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [symptoms, setSymptoms] = useState('');
  const [examFile, setExamFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editedDataUrl, setEditedDataUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DiagnoseExamOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorImageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout>();

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in event) {
      return {
        x: (event.touches[0].clientX - rect.left) * scaleX,
        y: (event.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if ('touches' in event && event.touches.length > 1) {
      setIsDrawing(false);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(event, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if ('touches' in event && event.touches.length > 1) {
      setIsDrawing(false);
      return;
    }
    
    event.preventDefault(); // Prevent scrolling on touch devices
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(event, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "Por favor, selecione um arquivo de imagem com menos de 4MB.",
        });
        return;
      }
      setExamFile(file);
      setEditedDataUrl(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdits = () => {
    const canvas = canvasRef.current;
    const image = editorImageRef.current;

    if (!canvas || !image || !previewUrl) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = image.naturalWidth;
    newCanvas.height = image.naturalHeight;
    const ctx = newCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(image, 0, 0, newCanvas.width, newCanvas.height);
    ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);

    setEditedDataUrl(newCanvas.toDataURL(examFile?.type || 'image/jpeg'));
    setIsEditorOpen(false);
  };

  const handleClearEdits = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    setEditedDataUrl(null);
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
      const examPhotoDataUri = editedDataUrl || previewUrl!;
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
  
  const handlePressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsEditorOpen(true);
    }, 2000);
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    const timeSincePress = performance.now() - (longPressTimerRef.current as any || 0);
    if (timeSincePress < 2000) {
      fileInputRef.current?.click();
    }
  };


  useEffect(() => {
    if (isEditorOpen && canvasRef.current && editorImageRef.current) {
        const canvas = canvasRef.current;
        const image = editorImageRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const setCanvasDimensions = () => {
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              ctx.lineWidth = Math.max(2, Math.min(image.naturalWidth, image.naturalHeight) * 0.005);
              ctx.strokeStyle = 'red';
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
            }

            if (image.complete) {
              setCanvasDimensions();
            } else {
              image.onload = setCanvasDimensions;
            }
        }
    }
  }, [isEditorOpen]);

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
              <CardDescription>Envie uma foto do seu exame ou problema e descreva os sintomas.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="exam-file" className="font-medium">Exame ou Foto do Problema</label>
                  <Input id="exam-file" ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  {!previewUrl ? (
                     <label htmlFor="exam-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 4MB)</p>
                        </div>
                    </label>
                  ) : (
                    <div 
                      className="mt-4 relative mx-auto w-full max-w-md group"
                      onMouseDown={handlePressStart}
                      onMouseUp={handlePressEnd}
                      onTouchStart={handlePressStart}
                      onTouchEnd={handlePressEnd}
                      onClick={(e) => e.preventDefault()} // Prevent click from firing immediately
                    >
                      <label htmlFor="exam-file" className="cursor-pointer">
                        <img 
                          src={editedDataUrl || previewUrl} 
                          alt="Pré-visualização" 
                          className="rounded-md w-full h-auto"
                        />
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                           <Pencil className="w-8 h-8 text-white" />
                           <span className="ml-2 text-white font-semibold">Segure para editar</span>
                         </div>
                      </label>
                      {editedDataUrl && (
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8" onClick={handleClearEdits}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Limpar edição</span>
                        </Button>
                      )}
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

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Editar Imagem</DialogTitle>
          </DialogHeader>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-muted/20">
            <div className="relative">
                <img ref={editorImageRef} src={previewUrl || ''} alt="Editor" className="max-w-full max-h-[calc(90vh-140px)] object-contain" />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
          </div>
          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdits}><Save className="mr-2 h-4 w-4" /> Salvar Edição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        <p>Criado por JOSÉ WELINSON BEZERRA DA SILVA</p>
      </footer>
    </div>
  );
}

    