"use client";

import { useState } from 'react';
import { Music, Sparkles, Download, Loader2, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateBeatsFromStyle } from '@/ai/flows/generate-beats-from-style';
import { suggestBeatImprovements } from '@/ai/flows/suggest-beat-improvements';

const stylePresets = ["Hip-hop", "Techno", "Jazz", "Lo-fi", "Trap", "House"];

export default function Home() {
  const [selectedStyle, setSelectedStyle] = useState<string>("Hip-hop");
  const [customStyle, setCustomStyle] = useState<string>("");
  const [generatedBeat, setGeneratedBeat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [beatDescription, setBeatDescription] = useState<string>("");

  const { toast } = useToast();

  const handleGenerateBeat = async () => {
    const styleToGenerate = customStyle || selectedStyle;
    if (!styleToGenerate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select or enter a style.",
      });
      return;
    }
    setIsLoading(true);
    setGeneratedBeat(null);
    setSuggestions([]);
    setBeatDescription(styleToGenerate);
    try {
      const result = await generateBeatsFromStyle({ style: styleToGenerate });
      setGeneratedBeat(result.beat);
    } catch (error) {
      console.error("Error generating beat:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate the beat. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!beatDescription) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Please describe the beat to get suggestions.",
      });
      return;
    }
    setIsImproving(true);
    setSuggestions([]);
    try {
      const result = await suggestBeatImprovements({
        modifiedBeat: beatDescription,
        targetStyle: customStyle || selectedStyle,
      });
      setSuggestions(result.suggestedImprovements);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast({
        variant: "destructive",
        title: "Failed to get suggestions",
        description: "Could not get suggestions. Please try again.",
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleStyleClick = (style: string) => {
    setSelectedStyle(style);
    setCustomStyle("");
  };
  
  const handleCustomStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStyle(e.target.value);
    if(e.target.value) {
      setSelectedStyle("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl flex items-center justify-center mb-8">
        <Music className="h-8 w-8 text-primary" />
        <h1 className="ml-3 text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          BeatGenius
        </h1>
      </header>
      
      <main className="w-full max-w-4xl grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-8">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">1. Choose Your Style</span>
              </CardTitle>
              <CardDescription>Select a preset or define your own musical style.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stylePresets.map((style) => (
                  <Button
                    key={style}
                    variant={selectedStyle === style ? 'default' : 'outline'}
                    onClick={() => handleStyleClick(style)}
                    className="transition-all duration-200"
                  >
                    {style}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-grow border-t border-border"></div>
                <span className="text-sm text-muted-foreground">OR</span>
                <div className="flex-grow border-t border-border"></div>
              </div>
              <div>
                <Label htmlFor="custom-style">Custom Style</Label>
                <Input
                  id="custom-style"
                  placeholder="e.g., '80s synthwave with a modern twist'"
                  value={customStyle}
                  onChange={handleCustomStyleChange}
                  className="mt-2"
                />
              </div>
              <Button onClick={handleGenerateBeat} disabled={isLoading || (!selectedStyle && !customStyle)} className="w-full group">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                )}
                Generate Beat
              </Button>
            </CardContent>
          </Card>

          {generatedBeat && (
            <Card className="bg-card/50 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  2. Refine with AI
                </CardTitle>
                <CardDescription>Get suggestions to improve your generated beat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="beat-description">Beat Description</Label>
                  <Textarea
                    id="beat-description"
                    placeholder="Describe your beat or what you'd like to change..."
                    value={beatDescription}
                    onChange={(e) => setBeatDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>
                 <Button onClick={handleGetSuggestions} disabled={isImproving} className="w-full group">
                  {isImproving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                  )}
                  Get Suggestions
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-8">
           <Card className="sticky top-8 bg-card/50 backdrop-blur-sm h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    Your Generated Beat
                </CardTitle>
                <CardDescription>
                    Listen to your creation and download it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 rounded-lg bg-muted/50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        <p className="mt-4 text-muted-foreground">Generating your masterpiece...</p>
                    </div>
                ) : generatedBeat ? (
                  <div className="space-y-4">
                    <audio controls src={generatedBeat} className="w-full rounded-md">
                      Your browser does not support the audio element.
                    </audio>
                    <a href={generatedBeat} download={`beatgenius-${(customStyle || selectedStyle).toLowerCase().replace(/\s/g, '_')}.wav`}>
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Beat
                      </Button>
                    </a>
                  </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 rounded-lg bg-muted/50 border-2 border-dashed">
                        <Music className="h-8 w-8 text-muted-foreground"/>
                        <p className="mt-4 text-muted-foreground text-center">Your generated beat will appear here.</p>
                    </div>
                )}
              </CardContent>
            </Card>

            {suggestions.length > 0 && (
                 <Card className="bg-card/50 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-accent"/>
                          AI Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
                            {suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
      </main>
    </div>
  );
}
