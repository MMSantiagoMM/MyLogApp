
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
  userInput: z.string().optional().describe('Optional standard input for the Java code. Each line is typically treated as a separate input by Scanner.'),
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
    description: 'Executes Java code and returns the output as a string. If userInput is provided, it simulates passing that input to the standard input of the Java program.',
    inputSchema: z.object({
      code: z.string().describe('The Java code to execute.'),
      userInput: z.string().optional().describe('Optional standard input for the Java code.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // This is a placeholder implementation.  In a real application, this would call
    // a secure code execution service like JDoodle or a sandboxed Docker container.
    // For now, it just returns a canned response.
    console.log(`Executing Java code: ${input.code}`);
    if (input.userInput) {
      console.log(`With user input: ${input.userInput}`);
    }
    let simulatedOutput = `Code execution is simulated. Real output would appear here.\nYour code was:\n${input.code}`;
    if (input.userInput) {
      simulatedOutput += `\n\nSimulated input received by program:\n${input.userInput}`;
    }
    return simulatedOutput;
  }
);

const compileCodePrompt = ai.definePrompt({
  name: 'compileCodePrompt',
  tools: [executeJavaCode],
  input: { schema: CompileCodeInputSchema },
  output: { schema: CompileCodeOutputSchema }, 
  prompt: `You are a Java code execution service.
The user provides Java code in the 'code' field.
Optionally, the user may provide standard input for the program in the 'userInput' field.
You MUST use the 'executeJavaCode' tool to execute this Java code, passing along the 'code' and any 'userInput'.
After the tool executes, take the string output from the tool and place it directly into the 'output' field of your JSON response.
Your entire response must be a JSON object matching the defined output schema, containing only the 'output' field with the tool's result.

Input Java Code:
\`\`\`java
{{{code}}}
\`\`\`
{{#if userInput}}
User Standard Input:
\`\`\`
{{{userInput}}}
\`\`\`
{{/if}}
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

    if (response.output && typeof response.output.output === 'string') {
      return response.output; 
    }

    console.error(
      "CompileCodeFlow: LLM did not produce the expected structured output. Full response:",
      JSON.stringify(response, null, 2)
    );

    if (response.toolRequests && response.toolRequests.length > 0) {
        for (const req of response.toolRequests) {
            const toolResponseData = response.toolResponses[req.toolRequestId];
            if (toolResponseData && typeof toolResponseData.output === 'string') {
                console.warn("CompileCodeFlow: Using direct tool output as fallback because structured LLM output was missing/invalid.");
                return { output: toolResponseData.output };
            }
        }
    }
    
    if (response.text) {
        console.warn("CompileCodeFlow: LLM did not produce structured output. Using raw text output as fallback.");
        return { output: response.text };
    }

    return {
      output: "Error: AI failed to process the code execution result into the expected format. No valid output string was found.",
    };
  }
);
