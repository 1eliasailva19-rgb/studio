import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {next} from '@genkit-ai/next';
import 'dotenv/config';

// This is the Genkit configuration file for local development.
// It is used by the Next.js app in development mode.
export const ai = genkit({
  plugins: [
    next({
      middleware: (req, next) => next(req),
    }),
    googleAI(),
  ],
  model: 'googleai/gemini-2.5-flash',
});
