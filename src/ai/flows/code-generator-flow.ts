'use server';
/**
 * @fileOverview Um fluxo de IA para gerar código a partir de um prompt do usuário.
 *
 * - generateCodeStream - Uma função que lida com o processo de geração de código como um stream.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export async function generateCodeStream(promptText: string) {
  const {stream, response} = ai.generateStream({
    prompt: `
        Você é um assistente de desenvolvimento de software especialista em Next.js, React, e Tailwind CSS.
        Sua tarefa é ajudar o usuário respondendo suas perguntas ou gerando código para um componente React.
        Se o usuário pedir código, gere-o dentro de um único bloco de código \`\`\`tsx ... \`\`\`.
        Se o usuário fizer uma pergunta, responda de forma conversacional e prestativa.
        Não misture explicações e código na mesma resposta, a menos que seja estritamente necessário.

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
