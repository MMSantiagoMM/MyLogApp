
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv'; // Import dotenv

// Ensure .env variables are loaded when this module is initialized
config(); 

const apiKeyFromEnv = process.env.GEMINI_API_KEY;

// Diagnostic log: Check if the API key is loaded from the environment
console.log('[genkit.ts] Attempting to load GEMINI_API_KEY. Value found:', 
            apiKeyFromEnv ? `Exists (length: ${apiKeyFromEnv.length})` : 'NOT FOUND or empty');

// For more direct debugging, you can uncomment the line below.
// WARNING: This will print your API key to the console. Do not commit or use in production.
// console.log('[genkit.ts] Actual GEMINI_API_KEY value:', apiKeyFromEnv);

if (!apiKeyFromEnv) {
  console.error('[genkit.ts] ERROR: GEMINI_API_KEY is not set in environment variables. The googleAI plugin will likely fail to initialize.');
  console.error('[genkit.ts] Please ensure your .env file is correctly set up and the server has been restarted.');
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKeyFromEnv }), // Explicitly pass the apiKey
  ],
  model: 'googleai/gemini-2.0-flash',
});
