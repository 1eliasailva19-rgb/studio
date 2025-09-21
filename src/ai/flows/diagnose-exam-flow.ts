
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
    .optional()
    .describe(
      "Uma foto de um exame médico ou do problema de saúde, como um URI de dados que deve incluir um tipo MIME e usar codificação Base64. A imagem pode conter marcações em vermelho para destacar áreas de interesse. Formato esperado: 'data:<mimetype>;base64,<dados_codificados>'. Este campo é opcional."
    ),
  symptoms: z.string().describe('A descrição dos sintomas do paciente.'),
});
export type DiagnoseExamInput = z.infer<typeof DiagnoseExamInputSchema>;

const DiagnoseExamOutputSchema = z.object({
  analysis: z.string().describe('A análise detalhada da imagem (se fornecida) e dos sintomas.'),
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
  prompt: `Você é um assistente médico de IA altamente qualificado. Sua tarefa é analisar a descrição dos sintomas fornecida pelo paciente e, se uma imagem for enviada, analisá-la também. A análise deve ser feita de forma profissional e respeitosa, independentemente da parte do corpo exibida, incluindo órgãos genitais.

{{#if examPhotoDataUri}}
A imagem pode conter marcações em vermelho feitas pelo usuário para destacar áreas de preocupação. Preste atenção especial a essas marcações em sua análise.
{{/if}}

Se a sua análise mencionar qualquer condição que possa ser uma Doença Sexualmente Transmissível (DST), você deve incluir a seguinte mensagem em sua resposta: "Previna-se, para sua segurança, use sempre preservativos durante as relações sexuais!"

Forneça uma análise detalhada e informativa com base nos dados. Se nenhuma foto for fornecida, baseie sua análise inteiramente na descrição dos sintomas.

**MUITO IMPORTANTE:** Sempre conclua sua resposta com o seguinte aviso legal, sem exceções: "AVISO: Esta é uma análise gerada por IA e não substitui uma consulta médica profissional. Consulte sempre um médico para obter um diagnóstico e tratamento adequados."

Use as seguintes informações:

Descrição dos Sintomas: {{{symptoms}}}
{{#if examPhotoDataUri}}
Foto: {{media url=examPhotoDataUri}}
{{/if}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
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
