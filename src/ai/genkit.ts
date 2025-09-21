import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import nextPlugin from '@genkit-ai/next';

// This is the main Genkit configuration file.
// It is used by the Genkit CLI and by the Next.js app in production.
export const ai = genkit({
  plugins: [
    nextPlugin({
      middleware: (req, next) => next(req),
    }),
    googleAI(),
  ],
  model: 'googleai/gemini-2.5-flash',
});
