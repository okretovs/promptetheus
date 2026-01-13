import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT token interceptor
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    try {
      const { state } = JSON.parse(authData);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (e) {
      console.error('Failed to parse auth token:', e);
    }
  }
  return config;
});

// Auth API
export const authApi = {
  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password }),
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
};

// Projects API
export const projectsApi = {
  list: () => api.get('/projects'),
  create: (name: string) => api.post('/projects', { name }),
  get: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, name: string) => api.put(`/projects/${id}`, { name }),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Intents API
export const intentsApi = {
  list: (projectId?: string) => api.get('/intents', { params: { projectId } }),
  create: (projectId: string, name: string, schema: any, sampleInput?: any) =>
    api.post('/intents', { projectId, name, schema, sampleInput }),
  get: (id: string) => api.get(`/intents/${id}`),
  update: (id: string, name: string, schema?: any, sampleInput?: any) =>
    api.put(`/intents/${id}`, { name, schema, sampleInput }),
  delete: (id: string) => api.delete(`/intents/${id}`),
  forge: (id: string, providers: string[]) =>
    api.post(`/intents/${id}/forge`, { providers }),
  execute: (id: string, providers: string[], input: any) =>
    api.post(`/intents/${id}/execute`, { providers, input }),
};

// API Keys API
export const keysApi = {
  list: () => api.get('/keys'),
  add: (provider: string, encryptedKey: string, iv: string) =>
    api.post('/keys', { provider, encryptedKey, iv }),
  delete: (provider: string) => api.delete(`/keys/${provider}`),
};

// Models API
export const modelsApi = {
  list: () => api.get('/models'),
};

// Executions API
export const executionsApi = {
  list: (intentId?: string) => api.get('/executions', { params: { intentId } }),
};

export default api;
