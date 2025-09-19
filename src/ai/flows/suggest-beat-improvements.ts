'use server';

/**
 * @fileOverview Suggests improvements to a user-modified beat based on the specified style.
 *
 * @remarks
 * This flow takes a user-modified beat and a target musical style as input.
 * It then leverages an AI model to suggest improvements to the beat, helping users refine their creations.
 *
 * @exports `suggestBeatImprovements` - The main function to trigger the beat improvement suggestions.
 * @exports `SuggestBeatImprovementsInput` - The input type for the `suggestBeatImprovements` function.
 * @exports `SuggestBeatImprovementsOutput` - The output type for the `suggestBeatImprovements` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * @interface SuggestBeatImprovementsInput
 * @description Defines the input schema for the beat improvement suggestion flow.
 * @property {string} modifiedBeat - A string representation of the user-modified beat.
 * @property {string} targetStyle - The target musical style for the beat.
 */
const SuggestBeatImprovementsInputSchema = z.object({
  modifiedBeat: z
    .string()
    .describe('A string representation of the user-modified beat.'),
  targetStyle: z.string().describe('The target musical style for the beat.'),
});
export type SuggestBeatImprovementsInput = z.infer<
  typeof SuggestBeatImprovementsInputSchema
>;

/**
 * @interface SuggestBeatImprovementsOutput
 * @description Defines the output schema for the beat improvement suggestion flow.
 * @property {string[]} suggestedImprovements - An array of strings, each representing a suggested improvement to the beat.
 */
const SuggestBeatImprovementsOutputSchema = z.object({
  suggestedImprovements: z
    .array(z.string())
    .describe(
      'An array of strings, each representing a suggested improvement to the beat.'
    ),
});
export type SuggestBeatImprovementsOutput = z.infer<
  typeof SuggestBeatImprovementsOutputSchema
>;

/**
 * @function suggestBeatImprovements
 * @description Wrapper function to trigger the suggestBeatImprovementsFlow.
 * @param {SuggestBeatImprovementsInput} input - The input for the beat improvement suggestion.
 * @returns {Promise<SuggestBeatImprovementsOutput>} A promise that resolves to the suggested improvements.
 */
export async function suggestBeatImprovements(
  input: SuggestBeatImprovementsInput
): Promise<SuggestBeatImprovementsOutput> {
  return suggestBeatImprovementsFlow(input);
}

const suggestBeatImprovementsPrompt = ai.definePrompt({
  name: 'suggestBeatImprovementsPrompt',
  input: { schema: SuggestBeatImprovementsInputSchema },
  output: { schema: SuggestBeatImprovementsOutputSchema },
  prompt: `You are an AI music assistant that suggests improvements to a user-created beat to match the specified style.

  The user has provided the following beat:
  {{modifiedBeat}}

  The target musical style is:
  {{targetStyle}}

  Suggest a few specific improvements to the beat to better align with the target style.  These suggestions should be concrete and actionable.
  The suggested improvements MUST be returned in JSON format.`,
});

const suggestBeatImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestBeatImprovementsFlow',
    inputSchema: SuggestBeatImprovementsInputSchema,
    outputSchema: SuggestBeatImprovementsOutputSchema,
  },
  async input => {
    const { output } = await suggestBeatImprovementsPrompt(input);
    return output!;
  }
);
