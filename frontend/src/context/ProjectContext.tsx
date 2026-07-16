import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Project {
  id: string;
  name: string;
  githubToken: string;
  githubRepos: string;
  k8sUrl: string;
  k8sToken: string;
  prometheusUrl: string;
  grafanaUrl: string;
  grafanaApiKey: string;
}

interface ProjectContextType {
  projects: Project[];
  activeProject: Project;
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  addProject: (name: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

const DEFAULT_PROJECT: Project = {
  id: 'main-workspace',
  name: 'Main Workspace',
  githubToken: '',
  githubRepos: '',
  k8sUrl: '',
  k8sToken: '',
  prometheusUrl: '',
  grafanaUrl: '',
  grafanaApiKey: '',
};

const STORAGE_KEY_PROJECTS = 'kubemind_projects';
const STORAGE_KEY_ACTIVE = 'kubemind_active_project_id';

const ProjectContext = createContext<ProjectContextType>({
  projects: [DEFAULT_PROJECT],
  activeProject: DEFAULT_PROJECT,
  activeProjectId: DEFAULT_PROJECT.id,
  setActiveProjectId: () => {},
  addProject: () => DEFAULT_PROJECT,
  updateProject: () => {},
  deleteProject: () => {},
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore parse error
    }
    return [DEFAULT_PROJECT];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE) || projects[0]?.id || DEFAULT_PROJECT.id;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE, activeProjectId);
  }, [activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || DEFAULT_PROJECT;

  const addProject = (name: string): Project => {
    const newProj: Project = {
      id: 'proj-' + Date.now(),
      name: name.trim() || 'New Workspace',
      githubToken: '',
      githubRepos: '',
      k8sUrl: '',
      k8sToken: '',
      prometheusUrl: '',
      grafanaUrl: '',
      grafanaApiKey: '',
    };
    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
    return newProj;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) return; // Prevent deleting last remaining project
    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (activeProjectId === id) {
        setActiveProjectId(filtered[0].id);
      }
      return filtered;
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        activeProjectId,
        setActiveProjectId,
        addProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
