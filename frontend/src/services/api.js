import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Parts API
export const partsApi = {
  // Get all parts
  getParts: async (params = {}) => {
    const response = await apiClient.get('/parts', { params });
    return response.data;
  },

  // Get part families
  getPartFamilies: async () => {
    const response = await apiClient.get('/parts/families');
    return response.data;
  },

  // Get part by ID
  getPartById: async (partId) => {
    const response = await apiClient.get(`/parts/${partId}`);
    return response.data;
  },

  // Create part
  createPart: async (partData) => {
    const response = await apiClient.post('/parts', partData);
    return response.data;
  },

  // Update part
  updatePart: async (partId, partData) => {
    const response = await apiClient.put(`/parts/${partId}`, partData);
    return response.data;
  },

  // Delete part
  deletePart: async (partId) => {
    const response = await apiClient.delete(`/parts/${partId}`);
    return response.data;
  },

  // Load Fritzing parts
  loadFritzingParts: async (forceReload = false) => {
    const response = await apiClient.post('/parts/load-fritzing-parts', null, {
      params: { force_reload: forceReload }
    });
    return response.data;
  },
};

// Projects API
export const projectsApi = {
  // Get all projects
  getProjects: async (params = {}) => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  // Get project by ID
  getProjectById: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  },

  // Create project
  createProject: async (projectData) => {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (projectId, projectData) => {
    const response = await apiClient.put(`/projects/${projectId}`, projectData);
    return response.data;
  },

  // Delete project
  deleteProject: async (projectId) => {
    const response = await apiClient.delete(`/projects/${projectId}`);
    return response.data;
  },

  // Duplicate project
  duplicateProject: async (projectId, newName = null) => {
    const response = await apiClient.post(`/projects/${projectId}/duplicate`, null, {
      params: { new_name: newName }
    });
    return response.data;
  },
};

// General API
export const generalApi = {
  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Root endpoint
  root: async () => {
    const response = await apiClient.get('/');
    return response.data;
  },
};

export default apiClient;