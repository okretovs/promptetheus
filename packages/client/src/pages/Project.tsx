import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';

export function Project() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentProject,
    intents,
    fetchIntents,
    createIntent,
    deleteIntent,
    setCurrentProject,
    projects,
    deleteProject,
    loading,
  } = useProjectStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIntentName, setNewIntentName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Set current project from the list
    const project = projects.find((p) => p.id === id);
    if (project) {
      setCurrentProject(project);
    }

    // Fetch intents for this project
    fetchIntents(id);
  }, [id, projects]);

  const handleCreateIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntentName.trim() || !id) return;

    try {
      // Create with empty schema and no sample input initially
      await createIntent(id, newIntentName, {}, undefined);
      setNewIntentName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create intent:', error);
    }
  };

  const handleDeleteIntent = async (intentId: string, name: string) => {
    if (confirm(`Delete intent "${name}"?`)) {
      try {
        await deleteIntent(intentId);
      } catch (error) {
        console.error('Failed to delete intent:', error);
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    if (
      confirm(
        `Delete project "${currentProject.name}"? This will also delete all intents.`
      )
    ) {
      try {
        await deleteProject(currentProject.id);
        navigate('/dashboard');
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-gray-400">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-300"
            >
              ← Back
            </button>
            {isEditingName ? (
              <input
                type="text"
                defaultValue={currentProject.name}
                className="input text-2xl font-bold"
                autoFocus
                onBlur={() => {
                  setIsEditingName(false);
                  // TODO: Implement project name update in future enhancement
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingName(false);
                  }
                }}
              />
            ) : (
              <h1
                className="text-2xl font-bold text-primary-500 cursor-pointer hover:text-primary-400"
                onClick={() => setIsEditingName(true)}
              >
                {currentProject.name}
              </h1>
            )}
          </div>
          <button onClick={handleDeleteProject} className="btn-secondary text-red-400 hover:text-red-300">
            Delete Project
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Intents</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            + Create Intent
          </button>
        </div>

        {loading && intents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading intents...</p>
          </div>
        ) : intents.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No intents yet</p>
            <p className="text-gray-500 mb-6">
              Create your first intent to start optimizing prompts
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              + Create Intent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intents.map((intent) => (
              <div
                key={intent.id}
                className="card p-6 hover:border-primary-500 transition-colors cursor-pointer"
              >
                <div onClick={() => navigate(`/intents/${intent.id}`)}>
                  <h3 className="text-xl font-semibold mb-2">{intent.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    Version {intent.version}
                  </p>
                  <p className="text-sm text-gray-500">
                    Updated {new Date(intent.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-dark-700 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/intents/${intent.id}`);
                    }}
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteIntent(intent.id, intent.name);
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create New Intent</h3>
            <form onSubmit={handleCreateIntent}>
              <div className="mb-4">
                <label
                  htmlFor="intentName"
                  className="block text-sm font-medium mb-1"
                >
                  Intent Name
                </label>
                <input
                  id="intentName"
                  type="text"
                  value={newIntentName}
                  onChange={(e) => setNewIntentName(e.target.value)}
                  className="input"
                  placeholder="Extract User Info"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewIntentName('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
