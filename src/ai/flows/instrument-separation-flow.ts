'use server';
/**
 * @fileOverview Fluxo de IA para separar instrumentos de uma faixa de música.
 *
 * - separateInstruments - Uma função que lida com o processo de separação de instrumentos.
 * - InstrumentSeparationInput - O tipo de entrada para a função separateInstruments.
 * - InstrumentSeparationOutput - O tipo de retorno para a função separateInstruments.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const InstrumentSeparationInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "O áudio a ser processado, como um data URI que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<mimetype>;base64,<dados_codificados>'."
    ),
});
export type InstrumentSeparationInput = z.infer<typeof InstrumentSeparationInputSchema>;

const InstrumentTrackSchema = z.object({
  name: z.string().describe('O nome do instrumento (ex: Bateria, Baixo, Guitarra, Vocal).'),
  audioDataUri: z.string().describe('O áudio da faixa do instrumento como um data URI em formato WAV.'),
});

const InstrumentSeparationOutputSchema = z.object({
  tracks: z.array(InstrumentTrackSchema).describe('Uma lista de faixas de instrumentos separados.'),
});
export type InstrumentSeparationOutput = z.infer<typeof InstrumentSeparationOutputSchema>;


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

const separateInstrumentsFlow = ai.defineFlow(
    {
      name: 'separateInstrumentsFlow',
      inputSchema: InstrumentSeparationInputSchema,
      outputSchema: InstrumentSeparationOutputSchema,
    },
    async (input) => {
        let { operation } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-audio-preview',
            prompt: `
                Você é um engenheiro de áudio especialista. 
                Separe a faixa de áudio fornecida em quatro stems: bateria, baixo, guitarra e vocais.
                Áudio: {{media url=audioDataUri}}
            `,
            config: {
                responseModalities: ['AUDIO'],
            },
            audioConfig: {
                stemConfigs: [
                    {stemName: "drums"},
                    {stemName: "bass"},
                    {stemName: "guitar"},
                    {stemName: "vocals"},
                ]
            }
        });

        if (!operation || operation.error) {
            console.error('Falha ao separar instrumentos:', operation?.error);
            throw new Error('Não foi possível processar o áudio.');
        }

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            operation = await ai.checkOperation(operation);
        }
        
        const mediaParts = operation.output?.message?.content || [];
        if (mediaParts.length === 0) {
            throw new Error('Nenhuma faixa de áudio foi retornada pelo modelo.');
        }

        const tracks = await Promise.all(mediaParts.map(async (part, index) => {
            const defaultNames = ['Bateria', 'Baixo', 'Guitarra', 'Vocal'];
            if (part.media && part.media.url) {
                const audioBuffer = Buffer.from(
                    part.media.url.substring(part.media.url.indexOf(',') + 1),
                    'base64'
                );
                const wavBase64 = await toWav(audioBuffer);
                return {
                    name: part.media.stemName || defaultNames[index] || `Instrumento ${index + 1}`,
                    audioDataUri: `data:audio/wav;base64,${wavBase64}`,
                };
            }
            throw new Error('Parte de mídia inválida recebida.');
        }));

        const nameMapping: { [key: string]: string } = {
          drums: 'Bateria',
          bass: 'Baixo',
          guitar: 'Guitarra',
          vocals: 'Vocal',
        };
      
        const mappedTracks = tracks.map(track => ({
          ...track,
          name: nameMapping[track.name.toLowerCase()] || track.name,
        }));

        return { tracks: mappedTracks };
    }
  );

export async function separateInstruments(input: InstrumentSeparationInput): Promise<InstrumentSeparationOutput> {
    return separateInstrumentsFlow(input);
}
