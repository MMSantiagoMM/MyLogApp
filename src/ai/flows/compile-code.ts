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
    description: 'Executes Java code and returns the output.',
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
    return `Code execution is simulated.  Real output would appear here.\nYour code was: ${input.code}`;
  }
);

const compileCodePrompt = ai.definePrompt({
  name: 'compileCodePrompt',
  tools: [executeJavaCode],
  prompt: `You are a Java code execution service. The user will provide Java code, you will execute it using the executeJavaCode tool, and return the output to the user.

Java Code: {{{code}}} `,
});

const compileCodeFlow = ai.defineFlow(
  {
    name: 'compileCodeFlow',
    inputSchema: CompileCodeInputSchema,
    outputSchema: CompileCodeOutputSchema,
  },
  async input => {
    const {output} = await compileCodePrompt(input);
    return {output: output!};
  }
);
