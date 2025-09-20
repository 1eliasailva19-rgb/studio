"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Code, Loader2, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { generateCodeStream } from '@/ai/flows/code-generator-flow';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Enviar a mensagem inicial do assistente quando o componente carregar
  useEffect(() => {
    const sendInitialMessage = async () => {
      setIsLoading(true);
      try {
        const stream = await generateCodeStream("Apresente-se", true);
        let assistantResponse = '';
        
        setMessages([{ role: 'assistant', content: '' }]);

        const reader = stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantResponse += chunk;
          setMessages([{ role: 'assistant', content: assistantResponse }]);
        }
      } catch (error) {
        console.error("Error generating initial message:", error);
        setMessages([{
          role: 'assistant',
          content: "Olá! Como posso ajudar você hoje?",
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    sendInitialMessage();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Passa `false` porque não é a primeira mensagem
      const stream = await generateCodeStream(input, false);
      let assistantResponse = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error generating code:", error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Desculpe, ocorreu um erro ao gerar a resposta. Por favor, tente novamente.",
      };
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length -1].role === 'assistant' && newMessages[newMessages.length -1].content === '') {
          newMessages[newMessages.length-1] = errorMessage;
          return newMessages;
        }
        return [...newMessages, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 border-b flex items-center justify-center">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold ml-2">AI App Builder</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <Card key={index} className={msg.role === 'user' ? 'bg-muted/50' : 'bg-card'}>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                {msg.role === 'user' ? (
                  <User className="h-5 w-5 text-accent" />
                ) : (
                  <Bot className="h-5 w-5 text-primary" />
                )}
                <CardTitle className="text-lg font-medium">
                  {msg.role === 'user' ? 'Você' : 'AI Assistant'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {msg.content.includes('```tsx') ? (
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
                    <code className="text-sm font-mono">{msg.content.replace(/```tsx|```/g, '').trim()}</code>
                  </pre>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </CardContent>
            </Card>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Descreva o componente que você quer criar..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading && messages.length > 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
