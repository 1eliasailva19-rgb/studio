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
        Você é um desenvolvedor de software especialista em Next.js, React, e Tailwind CSS.
        Sua tarefa é gerar o código para um único componente React baseado na descrição do usuário.
        O código deve ser completo e estar dentro de um único bloco de código \`\`\`tsx ... \`\`\`.
        Não inclua nenhuma explicação ou texto adicional, apenas o código.

        Descrição do usuário: "${promptText}"
    `,
    config: {
      temperature: 0.3,
    },
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(chunk.text);
      }
      controller.close();
    },
  });

  return readableStream;
}
