"use client";

import { useState } from 'react';
import { Bot, FileUp, Loader2, Microscope, AlertTriangle } from 'lucide-react';
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
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examFile || !symptoms) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, envie uma imagem do exame e descreva seus sintomas.",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const examPhotoDataUri = await fileToDataUri(examFile);
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
              <CardDescription>Envie seu exame e descreva seus sintomas</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="exam-file" className="font-medium">Exame Médico (Imagem)</label>
                  <Input id="exam-file" type="file" accept="image/*" onChange={handleFileChange} className="file:text-primary-foreground" />
                  {previewUrl && (
                    <div className="mt-4">
                      <img src={previewUrl} alt="Pré-visualização do Exame" className="rounded-md max-h-60 w-auto mx-auto" />
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
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Bot className="h-5 w-5 mr-2" /> Analisar Exame</>}
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
