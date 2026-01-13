import { ModelAdapter, IntentSchema, ExecutionResult } from './index.js';

export class LocalAdapter implements ModelAdapter {
  provider: 'local' = 'local';

  forge(intent: IntentSchema): string {
    return `[INST] ${intent.description}

Input format: ${JSON.stringify(intent.input)}
Output format: ${JSON.stringify(intent.output)}
${intent.constraints ? `Constraints: ${JSON.stringify(intent.constraints)}` : ''}

Respond with JSON only. [/INST]

Input:`;
  }

  async execute(prompt: string, input: any): Promise<ExecutionResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));

    return {
      output: {
        summary: `[MOCK Local Llama3] Result: ${JSON.stringify(input).substring(0, 50)}...`,
        confidence: 0.89,
      },
      latencyMs: Date.now() - startTime,
      tokens: Math.floor(Math.random() * 450) + 180,
    };
  }
}
