import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { keysApi, modelsApi } from '../services/api';
import { encryptApiKey } from '../services/crypto';

interface KeyStatus {
  [provider: string]: boolean;
}

interface ModelProfile {
  id: string;
  userId: string;
  provider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  createdAt: string;
}

export function Settings() {
  const navigate = useNavigate();
  const { encryptionKey } = useAuthStore();

  const [keyStatus, setKeyStatus] = useState<KeyStatus>({});
  const [loading, setLoading] = useState(true);
  const [showKeyInput, setShowKeyInput] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState('');
  const [saving, setSaving] = useState(false);

  const [modelProfiles, setModelProfiles] = useState<ModelProfile[]>([]);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<ModelProfile>>({
    provider: 'openai',
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
  });

  const providers = [
    { name: 'openai', displayName: 'OpenAI', requiresKey: true },
    { name: 'anthropic', displayName: 'Anthropic', requiresKey: true },
    { name: 'google', displayName: 'Google', requiresKey: true },
    { name: 'local', displayName: 'Local (Ollama)', requiresKey: false },
  ];

  useEffect(() => {
    fetchKeyStatus();
    fetchModelProfiles();
  }, []);

  const fetchKeyStatus = async () => {
    try {
      const response = await keysApi.list();
      setKeyStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch key status:', error);
      setLoading(false);
    }
  };

  const fetchModelProfiles = async () => {
    try {
      const response = await modelsApi.list();
      setModelProfiles(response.data);
    } catch (error) {
      console.error('Failed to fetch model profiles:', error);
    }
  };

  const handleAddKey = async (provider: string) => {
    if (!keyValue.trim()) {
      alert('Please enter an API key');
      return;
    }

    if (!encryptionKey) {
      alert('Encryption key not available. Please log out and log back in.');
      return;
    }

    setSaving(true);
    try {
      // Encrypt the key on the client side
      const { encrypted, iv } = await encryptApiKey(encryptionKey, keyValue);

      // Store encrypted key
      await keysApi.create(provider, encrypted, iv);

      // Refresh status
      await fetchKeyStatus();

      // Clear form
      setKeyValue('');
      setShowKeyInput(null);
      alert('API key added successfully!');
    } catch (error) {
      console.error('Failed to add API key:', error);
      alert('Failed to add API key. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKey = async (provider: string) => {
    if (!confirm(`Remove API key for ${provider}?`)) {
      return;
    }

    try {
      await keysApi.delete(provider);
      await fetchKeyStatus();
      alert('API key removed successfully!');
    } catch (error) {
      console.error('Failed to remove API key:', error);
      alert('Failed to remove API key. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editingProfile.provider || !editingProfile.modelName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingProfile.id) {
        // Update existing profile
        await modelsApi.update(
          editingProfile.id,
          editingProfile.modelName!,
          editingProfile.temperature!,
          editingProfile.maxTokens!
        );
      } else {
        // Create new profile
        await modelsApi.create(
          editingProfile.provider!,
          editingProfile.modelName!,
          editingProfile.temperature!,
          editingProfile.maxTokens!
        );
      }

      await fetchModelProfiles();
      setShowProfileEditor(false);
      setEditingProfile({
        provider: 'openai',
        modelName: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
      });
      alert('Model profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Delete this model profile?')) {
      return;
    }

    try {
      await modelsApi.delete(id);
      await fetchModelProfiles();
      alert('Model profile deleted successfully!');
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert('Failed to delete profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-300"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-primary-500">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* API Keys Section */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <p className="text-sm text-gray-400 mb-6">
            API keys are encrypted with your password and stored securely. They are
            never sent to the server in plain text.
          </p>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div
                  key={provider.name}
                  className="border border-dark-600 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{provider.displayName}</h3>
                      {provider.requiresKey ? (
                        keyStatus[provider.name] ? (
                          <p className="text-sm text-green-400 mt-1">
                            ✓ API Key Configured
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 mt-1">
                            No API Key
                          </p>
                        )
                      ) : (
                        <p className="text-sm text-gray-400 mt-1">
                          No API key required
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {provider.requiresKey &&
                        (keyStatus[provider.name] ? (
                          <button
                            onClick={() => handleRemoveKey(provider.name)}
                            className="btn-secondary text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowKeyInput(provider.name)}
                            className="btn-primary"
                          >
                            Add Key
                          </button>
                        ))}
                    </div>
                  </div>

                  {showKeyInput === provider.name && (
                    <div className="mt-4 p-4 bg-dark-800 rounded-md">
                      <label className="block text-sm font-medium mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={keyValue}
                        onChange={(e) => setKeyValue(e.target.value)}
                        className="input mb-3"
                        placeholder="sk-..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddKey(provider.name)}
                          disabled={saving}
                          className="btn-primary"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setShowKeyInput(null);
                            setKeyValue('');
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Model Profiles Section */}
        <section className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Model Profiles</h2>
              <p className="text-sm text-gray-400 mt-1">
                Customize model parameters for each provider
              </p>
            </div>
            <button
              onClick={() => setShowProfileEditor(true)}
              className="btn-primary"
            >
              + Add Profile
            </button>
          </div>

          {modelProfiles.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No model profiles yet. Add one to customize model parameters.
            </p>
          ) : (
            <div className="space-y-3">
              {modelProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="border border-dark-600 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">
                        {profile.provider} - {profile.modelName}
                        {profile.isDefault && (
                          <span className="ml-2 text-xs bg-primary-600 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </h3>
                      <div className="text-sm text-gray-400 mt-2 space-y-1">
                        <p>Temperature: {profile.temperature}</p>
                        <p>Max Tokens: {profile.maxTokens}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProfile(profile);
                          setShowProfileEditor(true);
                        }}
                        className="text-primary-400 hover:text-primary-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Model Profile Editor Modal */}
      {showProfileEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingProfile.id ? 'Edit' : 'Add'} Model Profile
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Provider
                </label>
                <select
                  value={editingProfile.provider}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, provider: e.target.value })
                  }
                  className="input"
                  disabled={!!editingProfile.id}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="local">Local (Ollama)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={editingProfile.modelName}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      modelName: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="gpt-4, claude-3-opus, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Temperature (0-2)
                </label>
                <input
                  type="number"
                  value={editingProfile.temperature}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="input"
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={editingProfile.maxTokens}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      maxTokens: parseInt(e.target.value),
                    })
                  }
                  className="input"
                  min="1"
                  max="32000"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowProfileEditor(false);
                  setEditingProfile({
                    provider: 'openai',
                    modelName: 'gpt-4',
                    temperature: 0.7,
                    maxTokens: 2048,
                  });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleSaveProfile} className="btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
