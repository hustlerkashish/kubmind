import { apiClient } from './apiClient';

export interface Incident {
  id: string;
  incidentCode: string;
  clusterName: string;
  namespace: string;
  podName: string;
  containerName: string;
  reason: 'CrashLoopBackOff' | 'ImagePullBackOff' | 'OOMKilled' | 'FailedScheduling' | string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | string;
  logSnippet: string;
  aiSummary: string;
  detectedAt: string;
  resolvedAt?: string;
}

export interface PodLogResponse {
  podName: string;
  namespace: string;
  containerName: string;
  tailLines: number;
  logs: string[];
}

export const incidentApi = {
  getIncidents: async (status = 'all', namespace = 'all'): Promise<Incident[]> => {
    const response = await apiClient.get('/incidents', { params: { status, namespace } });
    return response.data.data;
  },
  getIncidentById: async (id: string): Promise<Incident> => {
    const response = await apiClient.get(`/incidents/${id}`);
    return response.data.data;
  },
  updateIncidentStatus: async (id: string, status: string): Promise<Incident> => {
    const response = await apiClient.put(`/incidents/${id}/status`, { status });
    return response.data.data;
  },
  getPodLogs: async (namespace: string, podName: string, container?: string, tailLines = 100): Promise<PodLogResponse> => {
    const response = await apiClient.get(`/k8s/pods/${namespace}/${podName}/logs`, {
      params: { container, tailLines },
    });
    return response.data.data;
  },
};
