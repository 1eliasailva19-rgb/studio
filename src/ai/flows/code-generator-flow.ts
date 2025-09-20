'use server';
/**
 * @fileOverview Um fluxo de IA para gerar código a partir de um prompt do usuário.
 *
 * - generateCode - Uma função que lida com o processo de geração de código.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export async function generateCode(promptText: string): Promise<string> {
    return codeGeneratorFlow(promptText);
}

const codeGeneratorFlow = ai.defineFlow(
    {
      name: 'codeGeneratorFlow',
      inputSchema: z.string(),
      outputSchema: z.string(),
    },
    async (promptText) => {
        const llmResponse = await ai.generate({
            prompt: `
                Você é um desenvolvedor de software especialista em Next.js, React, e Tailwind CSS.
                Sua tarefa é gerar o código para um único componente React baseado na descrição do usuário.
                O código deve ser completo, estar dentro de um único bloco de código, e não deve incluir nenhuma explicação ou texto adicional, apenas o código.

                Descrição do usuário: "${promptText}"
            `,
            config: {
                temperature: 0.3,
            }
        });

        const generatedCode = llmResponse.text;
        
        // Limpa o resultado para remover o cercado de bloco de código, se houver.
        return generatedCode.replace(/```tsx|```javascript|```/g, '').trim();
    }
);
