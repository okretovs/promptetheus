import { IntentSchema, getAdapter, getDefaultModel } from './adapters/index.js';

export interface ForgedPrompt {
  provider: string;
  modelName: string;
  promptText: string;
}

export function forgePrompts(intent: IntentSchema, providers: string[]): ForgedPrompt[] {
  return providers.map(provider => {
    const adapter = getAdapter(provider);
    return {
      provider,
      modelName: getDefaultModel(provider),
      promptText: adapter.forge(intent),
    };
  });
}
