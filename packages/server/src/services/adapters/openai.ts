import { ModelAdapter, IntentSchema, ExecutionResult } from './index.js';

export class OpenAIAdapter implements ModelAdapter {
  provider: 'openai' = 'openai';

  forge(intent: IntentSchema): string {
    return `You are a helpful AI assistant. Follow this specification exactly:

Task: ${intent.description}

Input Schema:
${JSON.stringify(intent.input, null, 2)}

Output Schema (respond in this exact JSON format):
${JSON.stringify(intent.output, null, 2)}

${intent.constraints ? `Constraints:\n${JSON.stringify(intent.constraints, null, 2)}` : ''}

Process the following input and respond ONLY with valid JSON matching the output schema:`;
  }

  async execute(prompt: string, input: any): Promise<ExecutionResult> {
    // Mock execution - returns fake data
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    return {
      output: {
        summary: `[MOCK OpenAI GPT-4o] Processed: ${JSON.stringify(input).substring(0, 50)}...`,
        confidence: 0.95,
      },
      latencyMs: Date.now() - startTime,
      tokens: Math.floor(Math.random() * 500) + 200,
    };
  }
}
