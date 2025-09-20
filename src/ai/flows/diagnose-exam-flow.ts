'use server';
/**
 * @fileOverview Um fluxo de IA para analisar exames médicos ou fotos de problemas de saúde.
 *
 * - diagnoseExam - Uma função que lida com o processo de análise.
 * - DiagnoseExamInput - O tipo de entrada para a função diagnoseExam.
 * - DiagnoseExamOutput - O tipo de retorno para a função diagnoseExam.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseExamInputSchema = z.object({
  examPhotoDataUri: z
    .string()
    .describe(
      "Uma foto de um exame médico ou do problema de saúde, como um URI de dados que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<dados_codificados>'."
    ),
  symptoms: z.string().describe('A descrição dos sintomas do paciente.'),
});
export type DiagnoseExamInput = z.infer<typeof DiagnoseExamInputSchema>;

const DiagnoseExamOutputSchema = z.object({
  analysis: z.string().describe('A análise detalhada da imagem e dos sintomas fornecidos.'),
  disclaimer: z.string().describe('Um aviso de que a análise da IA não substitui uma consulta médica profissional.'),
});
export type DiagnoseExamOutput = z.infer<typeof DiagnoseExamOutputSchema>;

export async function diagnoseExam(input: DiagnoseExamInput): Promise<DiagnoseExamOutput> {
  return diagnoseExamFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseExamPrompt',
  input: {schema: DiagnoseExamInputSchema},
  output: {schema: DiagnoseExamOutputSchema},
  prompt: `Você é um assistente médico de IA altamente qualificado. Sua tarefa é analisar a imagem do exame médico ou do problema de saúde e a descrição dos sintomas fornecida pelo paciente.

Forneça uma análise detalhada e informativa com base nos dados.

**MUITO IMPORTANTE:** Sempre conclua sua resposta com o seguinte aviso legal, sem exceções: "AVISO: Esta é uma análise gerada por IA e não substitui uma consulta médica profissional. Consulte sempre um médico para obter um diagnóstico e tratamento adequados."

Use as seguintes informações:

Descrição dos Sintomas: {{{symptoms}}}
Foto: {{media url=examPhotoDataUri}}`,
});

const diagnoseExamFlow = ai.defineFlow(
  {
    name: 'diagnoseExamFlow',
    inputSchema: DiagnoseExamInputSchema,
    outputSchema: DiagnoseExamOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
