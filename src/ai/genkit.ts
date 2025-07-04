
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

// Load environment variables from .env file
config(); 

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey.includes("YOUR_")) {
  console.error(
    "[genkit.ts] ERROR: GEMINI_API_KEY is not set or is a placeholder in your environment variables. " +
    "The googleAI plugin will likely fail to initialize. Please ensure your .env file is " +
    "correctly set up and the Genkit server has been restarted."
  );
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
