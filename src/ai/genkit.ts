
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv'; // Import dotenv

// Ensure .env variables are loaded when this module is initialized
config(); 

const apiKey = process.env.GEMINI_API_KEY;

// You can uncomment this for debugging if needed, but the FAILED_PRECONDITION error is usually clear enough.
// if (!apiKey) {
//   console.warn(
//     'GEMINI_API_KEY is not set in environment variables. Google AI plugin initialization might fail.'
//   );
// }

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey }), // Explicitly pass the apiKey
  ],
  model: 'googleai/gemini-2.0-flash',
});
