import { ModelAdapter, IntentSchema, ExecutionResult } from './index.js';

export class GoogleAdapter implements ModelAdapter {
  provider: 'google' = 'google';

  forge(intent: IntentSchema): string {
    return `# Task Description
${intent.description}

## Input Format
\`\`\`json
${JSON.stringify(intent.input, null, 2)}
\`\`\`

## Required Output Format
Return JSON only:
\`\`\`json
${JSON.stringify(intent.output, null, 2)}
\`\`\`

${intent.constraints ? `## Constraints\n${JSON.stringify(intent.constraints, null, 2)}` : ''}

## Input Data
`;
  }

  async execute(prompt: string, input: any): Promise<ExecutionResult> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 180 + 120));

    return {
      output: {
        summary: `[MOCK Google Gemini] Response for: ${JSON.stringify(input).substring(0, 50)}...`,
        confidence: 0.93,
      },
      latencyMs: Date.now() - startTime,
      tokens: Math.floor(Math.random() * 550) + 220,
    };
  }
}
