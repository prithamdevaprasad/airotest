import { useState, useEffect, useCallback } from 'react';
import { projectsApi } from '../services/api';
import { mockProjects, saveProject as saveMockProject, getProjects as getMockProjects } from '../utils/mockData';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProjects = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedProjects = await projectsApi.getProjects(params);
      
      // If no projects returned from backend, use mock data as fallback
      if (fetchedProjects && fetchedProjects.length > 0) {
        setProjects(fetchedProjects);
      } else {
        console.log('No projects from backend, using mock data');
        const mockData = getMockProjects();
        setProjects(mockData);
      }
    } catch (err) {
      console.error('Failed to load projects from backend:', err);
      // Use mock data as fallback
      const mockData = getMockProjects();
      setProjects(mockData);
      setError('Using offline data - backend unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProject = useCallback(async (projectId) => {
    try {
      const project = await projectsApi.getProjectById(projectId);
      setCurrentProject(project);
      return project;
    } catch (err) {
      console.error('Failed to load project:', err);
      // Try to get from mock data
      const mockData = getMockProjects();
      const mockProject = mockData.find(p => p.id === projectId);
      if (mockProject) {
        setCurrentProject(mockProject);
        return mockProject;
      }
      throw err;
    }
  }, []);

  const createProject = useCallback(async (projectData) => {
    try {
      const newProject = await projectsApi.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      return newProject;
    } catch (err) {
      console.error('Failed to create project, using fallback:', err);
      // Fallback to mock storage
      const newProject = {
        id: `project-${Date.now()}`,
        ...projectData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      saveMockProject(newProject);
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      return newProject;
    }
  }, []);

  const updateProject = useCallback(async (projectId, projectData) => {
    try {
      const updatedProject = await projectsApi.updateProject(projectId, projectData);
      setProjects(prev => prev.map(project => 
        project.id === projectId ? updatedProject : project
      ));
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      console.error('Failed to update project, using fallback:', err);
      // Fallback to mock storage
      const updatedProject = {
        ...currentProject,
        ...projectData,
        updated_at: new Date().toISOString()
      };
      saveMockProject(updatedProject);
      setProjects(prev => prev.map(project => 
        project.id === projectId ? updatedProject : project
      ));
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject);
      }
      return updatedProject;
    }
  }, [currentProject]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      await projectsApi.deleteProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw err;
    }
  }, [currentProject]);

  const duplicateProject = useCallback(async (projectId, newName = null) => {
    try {
      const duplicatedProject = await projectsApi.duplicateProject(projectId, newName);
      setProjects(prev => [duplicatedProject, ...prev]);
      return duplicatedProject;
    } catch (err) {
      console.error('Failed to duplicate project:', err);
      throw err;
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    currentProject,
    loading,
    error,
    loadProjects,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    setCurrentProject,
    refetch: loadProjects
  };
};