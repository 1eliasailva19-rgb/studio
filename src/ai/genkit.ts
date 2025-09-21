import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {nextPlugin} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    nextPlugin({
      middleware: (req, next) => next(req),
    }),
    googleAI(),
  ],
  model: 'googleai/gemini-2.5-flash',
});
