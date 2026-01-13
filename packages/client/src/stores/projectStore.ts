import { create } from 'zustand';
import { projectsApi, intentsApi } from '../services/api';

interface Project {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

interface Intent {
  id: string;
  projectId: string;
  name: string;
  schema: any;
  sampleInput?: any;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  intents: Intent[];
  currentIntent: Intent | null;
  loading: boolean;
  error: string | null;

  // Project actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;

  // Intent actions
  fetchIntents: (projectId: string) => Promise<void>;
  createIntent: (projectId: string, name: string, schema: any, sampleInput?: any) => Promise<Intent>;
  updateIntent: (id: string, name: string, schema?: any, sampleInput?: any) => Promise<void>;
  deleteIntent: (id: string) => Promise<void>;
  setCurrentIntent: (intent: Intent | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  intents: [],
  currentIntent: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await projectsApi.list();
      set({ projects: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createProject: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const response = await projectsApi.create(name);
      const newProject = response.data;
      set((state) => ({
        projects: [...state.projects, newProject],
        loading: false,
      }));
      return newProject;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await projectsApi.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  fetchIntents: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await intentsApi.list(projectId);
      set({ intents: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createIntent: async (projectId: string, name: string, schema: any, sampleInput?: any) => {
    set({ loading: true, error: null });
    try {
      const response = await intentsApi.create(projectId, name, schema, sampleInput);
      const newIntent = response.data;
      set((state) => ({
        intents: [...state.intents, newIntent],
        loading: false,
      }));
      return newIntent;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateIntent: async (id: string, name: string, schema?: any, sampleInput?: any) => {
    set({ loading: true, error: null });
    try {
      await intentsApi.update(id, name, schema, sampleInput);
      set((state) => ({
        intents: state.intents.map((i) =>
          i.id === id ? { ...i, name, schema, sampleInput } : i
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteIntent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await intentsApi.delete(id);
      set((state) => ({
        intents: state.intents.filter((i) => i.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setCurrentIntent: (intent) => set({ currentIntent: intent }),
}));
