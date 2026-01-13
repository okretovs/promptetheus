import { useEffect, useState } from 'react';
import { keysApi } from '../services/api';

interface ModelSelectorProps {
  selectedProviders: string[];
  onChange: (providers: string[]) => void;
}

interface Provider {
  name: string;
  displayName: string;
  hasKey: boolean;
}

const PROVIDERS = [
  { name: 'openai', displayName: 'OpenAI' },
  { name: 'anthropic', displayName: 'Anthropic' },
  { name: 'google', displayName: 'Google' },
  { name: 'local', displayName: 'Local (Ollama)' },
];

export function ModelSelector({ selectedProviders, onChange }: ModelSelectorProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const fetchKeyStatus = async () => {
    try {
      const response = await keysApi.list();
      const keyStatus = response.data;

      const providersWithStatus = PROVIDERS.map((p) => ({
        ...p,
        hasKey: keyStatus[p.name] || p.name === 'local', // Local doesn't need API key
      }));

      setProviders(providersWithStatus);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch key status:', error);
      // Default to all providers without keys except local
      setProviders(
        PROVIDERS.map((p) => ({
          ...p,
          hasKey: p.name === 'local',
        }))
      );
      setLoading(false);
    }
  };

  const handleToggle = (providerName: string) => {
    const provider = providers.find((p) => p.name === providerName);
    if (!provider?.hasKey) {
      alert(
        `No API key configured for ${provider?.displayName}. Please add an API key in Settings.`
      );
      return;
    }

    if (selectedProviders.includes(providerName)) {
      onChange(selectedProviders.filter((p) => p !== providerName));
    } else {
      onChange([...selectedProviders, providerName]);
    }
  };

  const handleSelectAll = () => {
    const availableProviders = providers
      .filter((p) => p.hasKey)
      .map((p) => p.name);
    onChange(availableProviders);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  if (loading) {
    return <div className="text-gray-400">Loading providers...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium">Select Providers</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-primary-400 hover:text-primary-300"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-xs text-primary-400 hover:text-primary-300"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {providers.map((provider) => (
          <label
            key={provider.name}
            className={`card p-4 cursor-pointer transition-colors ${
              selectedProviders.includes(provider.name)
                ? 'border-primary-500 bg-primary-900/20'
                : provider.hasKey
                ? 'hover:border-dark-500'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedProviders.includes(provider.name)}
                onChange={() => handleToggle(provider.name)}
                disabled={!provider.hasKey}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">{provider.displayName}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {provider.hasKey ? (
                    <span className="text-green-400">✓ Configured</span>
                  ) : (
                    <span className="text-red-400">✗ No API Key</span>
                  )}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {selectedProviders.length === 0 && (
        <p className="text-sm text-gray-400 mt-3">
          Select at least one provider to forge prompts
        </p>
      )}
    </div>
  );
}
