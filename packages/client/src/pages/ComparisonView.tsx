import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { executionsApi } from '../services/api';

interface ExecutionResult {
  id: string;
  intentId: string;
  forgedPromptId: string;
  provider: string;
  input: any;
  output: any;
  latencyMs: number;
  tokensUsed: number;
  executedAt: string;
}

interface ForgedPrompt {
  id: string;
  intentId: string;
  provider: string;
  promptText: string;
  version: number;
  createdAt: string;
}

export function ComparisonView() {
  const { intentId } = useParams<{ intentId: string }>();
  const navigate = useNavigate();
  const { currentIntent, setCurrentIntent, intents } = useProjectStore();

  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [forgedPrompts, setForgedPrompts] = useState<Record<string, ForgedPrompt>>({});
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  useEffect(() => {
    if (!intentId) return;

    // Set current intent
    const intent = intents.find((i) => i.id === intentId);
    if (intent) {
      setCurrentIntent(intent);
    }

    // Fetch executions for this intent
    fetchExecutions();
  }, [intentId, intents]);

  const fetchExecutions = async () => {
    if (!intentId) return;

    try {
      setLoading(true);
      const response = await executionsApi.list(intentId);
      const executionData = response.data;

      setExecutions(executionData);

      // Build forged prompts lookup
      const promptsMap: Record<string, ForgedPrompt> = {};
      executionData.forEach((exec: any) => {
        if (exec.forgedPrompt) {
          promptsMap[exec.forgedPromptId] = exec.forgedPrompt;
        }
      });
      setForgedPrompts(promptsMap);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      setLoading(false);
    }
  };

  const handleBackToEditor = () => {
    if (intentId) {
      navigate(`/intents/${intentId}`);
    }
  };

  const formatJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: 'text-green-400',
      anthropic: 'text-orange-400',
      google: 'text-blue-400',
      local: 'text-purple-400',
    };
    return colors[provider] || 'text-gray-400';
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      local: 'Local (Ollama)',
    };
    return names[provider] || provider;
  };

  if (!currentIntent) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-gray-400">Loading intent...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={handleBackToEditor}
              className="text-gray-400 hover:text-gray-300"
            >
              ← Back to Editor
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary-500">
                {currentIntent.name}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Execution Results Comparison
              </p>
            </div>
            <button
              onClick={fetchExecutions}
              className="btn-secondary"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading && executions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading execution results...</p>
          </div>
        ) : executions.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No execution results yet</p>
            <p className="text-gray-500 mb-6">
              Execute prompts from the intent editor to see results here
            </p>
            <button onClick={handleBackToEditor} className="btn-primary">
              Go to Editor
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Execution History List */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Execution History</h2>
              <div className="space-y-2">
                {executions.map((execution) => (
                  <button
                    key={execution.id}
                    onClick={() => setSelectedExecution(execution.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedExecution === execution.id
                        ? 'border-primary-500 bg-primary-900/20'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`font-semibold ${getProviderColor(
                            execution.provider
                          )}`}
                        >
                          {getProviderName(execution.provider)}
                        </span>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(execution.executedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {execution.latencyMs}ms
                        </p>
                        <p className="text-sm text-gray-400">
                          {execution.tokensUsed} tokens
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Execution Details */}
            {selectedExecution && (() => {
              const execution = executions.find((e) => e.id === selectedExecution);
              const forgedPrompt = execution ? forgedPrompts[execution.forgedPromptId] : null;

              return execution ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Prompt & Input */}
                  <div className="space-y-6">
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-3">
                        Forged Prompt
                        <span className={`ml-2 ${getProviderColor(execution.provider)}`}>
                          ({getProviderName(execution.provider)})
                        </span>
                      </h3>
                      <div className="bg-dark-800 border border-dark-600 rounded-md p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                          {forgedPrompt?.promptText || 'Prompt not found'}
                        </pre>
                      </div>
                      {forgedPrompt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Version {forgedPrompt.version} • Created{' '}
                          {new Date(forgedPrompt.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-3">Input Data</h3>
                      <div className="bg-dark-800 border border-dark-600 rounded-md p-4 max-h-64 overflow-y-auto">
                        <pre className="text-sm text-gray-300">
                          {formatJSON(execution.input)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Right: Output & Metrics */}
                  <div className="space-y-6">
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-3">Output</h3>
                      <div className="bg-dark-800 border border-dark-600 rounded-md p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-300">
                          {formatJSON(execution.output)}
                        </pre>
                      </div>
                    </div>

                    <div className="card p-6">
                      <h3 className="text-lg font-semibold mb-3">Execution Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Provider:</span>
                          <span className={getProviderColor(execution.provider)}>
                            {getProviderName(execution.provider)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Latency:</span>
                          <span>{execution.latencyMs}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tokens Used:</span>
                          <span>{execution.tokensUsed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Executed At:</span>
                          <span className="text-sm">
                            {new Date(execution.executedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
