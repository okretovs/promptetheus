// Intent Schema interface matching the spec
export interface IntentSchema {
  name: string;
  version: string;
  description: string;
  input: Record<string, any>;
  output: Record<string, any>;
  constraints?: Record<string, any>;
}

// Execution result interface
export interface ExecutionResult {
  output: any;
  latencyMs: number;
  tokens: number;
}

// Model adapter interface
export interface ModelAdapter {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  forge(intent: IntentSchema): string;
  execute(prompt: string, input: any, apiKey: string): Promise<ExecutionResult>;
}

// Import adapters
import { OpenAIAdapter } from './openai.js';
import { AnthropicAdapter } from './anthropic.js';
import { GoogleAdapter } from './google.js';
import { LocalAdapter } from './local.js';

// Adapter factory function
export function getAdapter(provider: string): ModelAdapter {
  switch (provider) {
    case 'openai':
      return new OpenAIAdapter();
    case 'anthropic':
      return new AnthropicAdapter();
    case 'google':
      return new GoogleAdapter();
    case 'local':
      return new LocalAdapter();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Get default model for each provider
export function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
    google: 'gemini-1.5-pro',
    local: 'llama3',
  };
  return defaults[provider] || 'unknown';
}
