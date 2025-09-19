'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating music beats based on a selected style preset.
 *
 * The flow takes a style preset as input and generates a unique beat in that style.
 * It exports the `generateBeatsFromStyle` function, the `GenerateBeatsFromStyleInput` type, and the `GenerateBeatsFromStyleOutput` type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateBeatsFromStyleInputSchema = z.object({
  style: z
    .string()
    .describe(
      'The musical style preset to use for beat generation (e.g., hip-hop, techno, jazz).'
    ),
});
export type GenerateBeatsFromStyleInput = z.infer<
  typeof GenerateBeatsFromStyleInputSchema
>;

const GenerateBeatsFromStyleOutputSchema = z.object({
  beat: z
    .string()
    .describe(
      'The generated beat in WAV format as a data URI, Base64 encoded.'
    ),
});
export type GenerateBeatsFromStyleOutput = z.infer<
  typeof GenerateBeatsFromStyleOutputSchema
>;

export async function generateBeatsFromStyle(
  input: GenerateBeatsFromStyleInput
): Promise<GenerateBeatsFromStyleOutput> {
  return generateBeatsFromStyleFlow(input);
}

const generateBeatsFromStylePrompt = ai.definePrompt({
  name: 'generateBeatsFromStylePrompt',
  input: {schema: GenerateBeatsFromStyleInputSchema},
  output: {schema: GenerateBeatsFromStyleOutputSchema},
  prompt: `You are a music beat generation AI. Generate a unique music beat in the style of {{{style}}}, provide the result as PCM data.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateBeatsFromStyleFlow = ai.defineFlow(
  {
    name: 'generateBeatsFromStyleFlow',
    inputSchema: GenerateBeatsFromStyleInputSchema,
    outputSchema: GenerateBeatsFromStyleOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {},
      },
      prompt: `Generate music beat in the style of ${input.style}`,
    });

    if (!media) {
      throw new Error('No media returned from beat generation.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));
    return {beat: wavDataUri};
  }
);
