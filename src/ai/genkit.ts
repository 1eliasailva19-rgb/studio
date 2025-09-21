import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {next} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    next({
      middleware: (req, next) => next(req),
    }),
    googleAI(),
  ],
  model: 'googleai/gemini-2.5-flash',
});
