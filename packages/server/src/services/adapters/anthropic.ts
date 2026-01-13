import { ModelAdapter, IntentSchema, ExecutionResult } from './index.js';

export class AnthropicAdapter implements ModelAdapter {
  provider: 'anthropic' = 'anthropic';

  forge(intent: IntentSchema): string {
    return `<task>
${intent.description}
</task>

<input_specification>
${JSON.stringify(intent.input, null, 2)}
</input_specification>

<output_specification>
Respond with ONLY valid JSON matching this schema:
${JSON.stringify(intent.output, null, 2)}
</output_specification>

${intent.constraints ? `<constraints>\n${JSON.stringify(intent.constraints, null, 2)}\n</constraints>` : ''}

Process this input:`;
  }

  async execute(prompt: string, input: any): Promise<ExecutionResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 250 + 150));

    return {
      output: {
        summary: `[MOCK Anthropic Claude Sonnet] Analyzed: ${JSON.stringify(input).substring(0, 50)}...`,
        confidence: 0.97,
      },
      latencyMs: Date.now() - startTime,
      tokens: Math.floor(Math.random() * 600) + 250,
    };
  }
}
