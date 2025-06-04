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
    description: 'Executes Java code using an external API and returns the output as a string. If userInput is provided, it is passed as standard input to the Java program.',
    inputSchema: z.object({
      code: z.string().describe('The Java code to execute.'),
      userInput: z.string().optional().describe('Optional standard input for the Java code.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("JDoodle API credentials (JDOODLE_CLIENT_ID, JDOODLE_CLIENT_SECRET) are not set in .env");
      return "Error: JDoodle API credentials are not configured. Please contact the administrator.";
    }

    const program = {
      script: input.code,
      stdin: input.userInput || "",
      language: "java",
      versionIndex: "4", // Corresponds to JDK 11 on JDoodle, "5" for JDK 17. Adjust as needed.
      clientId: clientId,
      clientSecret: clientSecret,
    };

    try {
      const response = await fetch('https://api.jdoodle.com/v1/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(program),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`JDoodle API error: ${response.status} ${response.statusText}`, errorBody);
        return `Error executing code via JDoodle: ${response.statusText}. Details: ${errorBody}`;
      }

      const result = await response.json();

      if (result.error) {
        console.error("JDoodle execution error:", result.error);
        return `Execution Error: ${result.error}`;
      }
      
      // The 'output' field from JDoodle contains stdout, stderr, etc.
      // Concatenate them for now, or adjust based on more specific needs.
      let outputString = result.output || "";
      if (result.cpuTime) outputString += `\nCPU Time: ${result.cpuTime}s`;
      if (result.memory) outputString += `\nMemory: ${result.memory}KB`;
      
      return outputString || "No output from code execution.";

    } catch (error: any) {
      console.error("Error calling JDoodle API:", error);
      return `An unexpected error occurred while trying to execute the code: ${error.message}`;
    }
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