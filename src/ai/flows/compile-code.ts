'use server';

/**
 * @fileOverview This file contains the Genkit flow for compiling and running Java code online.
 *
 * - compileCode - A function that handles the compilation and execution of Java code.
 * - CompileCodeInput - The input type for the compileCode function.
 * - CompileCodeOutput - The return type for the compileCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompileCodeInputSchema = z.object({
  code: z.string().describe('The Java code to compile and run.'),
});
export type CompileCodeInput = z.infer<typeof CompileCodeInputSchema>;

const CompileCodeOutputSchema = z.object({
  output: z.string().describe('The output from compiling and running the Java code.'),
});
export type CompileCodeOutput = z.infer<typeof CompileCodeOutputSchema>;

export async function compileCode(input: CompileCodeInput): Promise<CompileCodeOutput> {
  return compileCodeFlow(input);
}

const executeJavaCode = ai.defineTool(
  {
    name: 'executeJavaCode',
    description: 'Executes Java code and returns the output as a string.',
    inputSchema: z.object({
      code: z.string().describe('The Java code to execute.'),
    }),
    outputSchema: z.string(),
  },
  async input => {
    // This is a placeholder implementation.  In a real application, this would call
    // a secure code execution service like JDoodle or a sandboxed Docker container.
    // For now, it just returns a canned response.
    console.log(`Executing Java code: ${input.code}`);
    return `Code execution is simulated. Real output would appear here.\nYour code was:\n${input.code}`;
  }
);

const compileCodePrompt = ai.definePrompt({
  name: 'compileCodePrompt',
  tools: [executeJavaCode],
  input: { schema: CompileCodeInputSchema },
  output: { schema: CompileCodeOutputSchema }, // Ensure the LLM structures its output
  prompt: `You are a Java code execution service.
The user provides Java code in the 'code' field.
You MUST use the 'executeJavaCode' tool to execute this Java code.
After the tool executes, take the string output from the tool and place it directly into the 'output' field of your JSON response.
Your entire response must be a JSON object matching the defined output schema, containing only the 'output' field with the tool's result.

Input Java Code:
\`\`\`java
{{{code}}}
\`\`\`
`,
});

const compileCodeFlow = ai.defineFlow(
  {
    name: 'compileCodeFlow',
    inputSchema: CompileCodeInputSchema,
    outputSchema: CompileCodeOutputSchema,
  },
  async (input: CompileCodeInput): Promise<CompileCodeOutput> => {
    const response = await compileCodePrompt(input);

    // response.output should be populated if the LLM successfully follows the output schema
    if (response.output && typeof response.output.output === 'string') {
      return response.output; // Expected: { output: "some string from LLM/tool" }
    }

    // Fallback / Error handling
    console.error(
      "CompileCodeFlow: LLM did not produce the expected structured output. Full response:",
      JSON.stringify(response, null, 2)
    );

    // Attempt to find tool output directly if structured output failed
    if (response.toolRequests && response.toolRequests.length > 0) {
        for (const req of response.toolRequests) {
            const toolResponseData = response.toolResponses[req.toolRequestId];
            if (toolResponseData && typeof toolResponseData.output === 'string') {
                console.warn("CompileCodeFlow: Using direct tool output as fallback because structured LLM output was missing/invalid.");
                return { output: toolResponseData.output };
            }
        }
    }
    
    // If there's any text output from the LLM, use it as a last resort
    if (response.text) {
        console.warn("CompileCodeFlow: LLM did not produce structured output. Using raw text output as fallback.");
        return { output: response.text };
    }

    return {
      output: "Error: AI failed to process the code execution result into the expected format. No valid output string was found.",
    };
  }
);
