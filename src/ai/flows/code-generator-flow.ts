'use server';
/**
 * @fileOverview Um fluxo de IA para gerar código a partir de um prompt do usuário.
 *
 * - generateCodeStream - Uma função que lida com o processo de geração de código como um stream.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export async function generateCodeStream(promptText: string, isFirstMessage: boolean) {
  let systemPrompt = `
      Você é um assistente de desenvolvimento de software especialista em Next.js, React, e Tailwind CSS.
      Sua tarefa é ajudar o usuário respondendo suas perguntas ou gerando código para um componente React.
      
      Regras importantes:
      1. Se o usuário perguntar quem criou este aplicativo, responda EXATAMENTE: "Este aplicativo foi criado por JOSÉ WELINSON BEZERRA DA SILVA."
      2. Se o usuário pedir código, gere-o dentro de um único bloco de código \`\`\`tsx ... \`\`\`.
      3. Se o usuário fizer uma pergunta, responda de forma conversacional e prestativa.
      4. Não misture explicações e código na mesma resposta, a menos que seja estritamente necessário.
  `;

  if (isFirstMessage) {
    systemPrompt += `\n5. Comece sua primeira mensagem com uma saudação profissional, se apresentando como a IA criada por Welinson. Por exemplo: "Olá! Sou sua inteligência artificial, criada por Welinson. Como posso ajudar a construir algo incrível hoje?"`;
  }

  const {stream, response} = ai.generateStream({
    prompt: `
        ${systemPrompt}

        Descrição do usuário: "${promptText}"
    `,
    config: {
      temperature: 0.3,
    },
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(encoder.encode(chunk.text));
      }
      controller.close();
    },
  });

  return readableStream;
}
