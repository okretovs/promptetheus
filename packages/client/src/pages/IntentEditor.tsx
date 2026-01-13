import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { SchemaEditor } from '../components/SchemaEditor';
import { ModelSelector } from '../components/ModelSelector';
import { intentsApi } from '../services/api';

export function IntentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentIntent, setCurrentIntent, updateIntent, intents } = useProjectStore();

  const [name, setName] = useState('');
  const [schemaText, setSchemaText] = useState('{}');
  const [sampleInputText, setSampleInputText] = useState('{}');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [forging, setForging] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Find intent from the list
    const intent = intents.find((i) => i.id === id);
    if (intent) {
      setCurrentIntent(intent);
      setName(intent.name);
      setSchemaText(JSON.stringify(intent.schema || {}, null, 2));
      setSampleInputText(JSON.stringify(intent.sampleInput || {}, null, 2));
    }
  }, [id, intents]);

  const handleSave = async () => {
    if (!currentIntent) return;

    setSaving(true);
    try {
      let schema;
      let sampleInput;

      try {
        schema = JSON.parse(schemaText);
      } catch {
        alert('Invalid JSON in schema');
        setSaving(false);
        return;
      }

      try {
        sampleInput = sampleInputText.trim() ? JSON.parse(sampleInputText) : undefined;
      } catch {
        alert('Invalid JSON in sample input');
        setSaving(false);
        return;
      }

      await updateIntent(currentIntent.id, name, schema, sampleInput);
      alert('Intent saved successfully!');
    } catch (error) {
      console.error('Failed to save intent:', error);
      alert('Failed to save intent');
    } finally {
      setSaving(false);
    }
  };

  const handleForge = async () => {
    if (!currentIntent) return;

    if (selectedProviders.length === 0) {
      alert('Please select at least one provider');
      return;
    }

    setForging(true);
    try {
      let schema;
      try {
        schema = JSON.parse(schemaText);
      } catch {
        alert('Invalid JSON in schema. Please fix before forging.');
        setForging(false);
        return;
      }

      // First save the current state
      await updateIntent(currentIntent.id, name, schema, undefined);

      // Then forge prompts
      const response = await intentsApi.forge(currentIntent.id, selectedProviders);
      alert(`Successfully forged ${response.data.prompts.length} prompts!`);

      // Navigate to comparison view (to be implemented in Sprint 7)
      // For now, just show success
    } catch (error) {
      console.error('Failed to forge prompts:', error);
      alert('Failed to forge prompts');
    } finally {
      setForging(false);
    }
  };

  const handleExecute = async () => {
    if (!currentIntent) return;

    if (selectedProviders.length === 0) {
      alert('Please select at least one provider');
      return;
    }

    try {
      // Validate sample input before proceeding
      try {
        if (sampleInputText.trim()) {
          JSON.parse(sampleInputText); // Just validate, will use value in Sprint 7
        }
      } catch {
        alert('Invalid JSON in sample input. Please fix before executing.');
        return;
      }

      // First save and forge
      await handleForge();

      // Then execute (navigate to comparison page)
      // This will be fully implemented in Sprint 7
      alert('Execute functionality will be completed in Sprint 7');
    } catch (error) {
      console.error('Failed to execute:', error);
    }
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
              onClick={() => navigate(`/projects/${currentIntent.projectId}`)}
              className="text-gray-400 hover:text-gray-300"
            >
              ← Back to Project
            </button>
          </div>
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input text-2xl font-bold bg-transparent border-none px-0 focus:ring-0"
              placeholder="Intent Name"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-secondary"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleForge}
                disabled={forging || selectedProviders.length === 0}
                className="btn-primary"
              >
                {forging ? 'Forging...' : 'Forge Prompts'}
              </button>
              <button
                onClick={handleExecute}
                disabled={selectedProviders.length === 0}
                className="btn-primary bg-green-600 hover:bg-green-700"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Editors */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">JSON Schema</h3>
              <p className="text-sm text-gray-400 mb-3">
                Define the structure and validation rules for your intent
              </p>
              <SchemaEditor value={schemaText} onChange={setSchemaText} height="400px" />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Sample Input</h3>
              <p className="text-sm text-gray-400 mb-3">
                Provide example input data for testing your prompts
              </p>
              <SchemaEditor
                value={sampleInputText}
                onChange={setSampleInputText}
                height="200px"
              />
            </div>
          </div>

          {/* Right Column: Actions & Preview */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4">Forge Settings</h3>
              <ModelSelector
                selectedProviders={selectedProviders}
                onChange={setSelectedProviders}
              />
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-3">Intent Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Version:</span>
                  <span>{currentIntent.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span>{new Date(currentIntent.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated:</span>
                  <span>{new Date(currentIntent.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-dark-800">
              <h3 className="text-lg font-semibold mb-3">How it works</h3>
              <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                <li>Define your JSON schema for the desired output structure</li>
                <li>Optionally provide sample input data</li>
                <li>Select which AI providers to use</li>
                <li>Click "Forge Prompts" to generate optimized prompts</li>
                <li>Click "Execute" to test prompts with your sample input</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
