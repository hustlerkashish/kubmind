import { apiClient } from './apiClient';

export interface Recommendation {
  id: string;
  incidentCode?: string;
  clusterName: string;
  namespace: string;
  podName: string;
  recommendationType: 'RESOURCE_ADJUSTMENT' | 'REPLICA_SCALING' | 'COMMAND' | 'RECURRING_INCIDENT' | string;
  actionSummary: string;
  suggestedCommand?: string;
  cpuAdjustment?: string;
  memoryAdjustment?: string;
  replicaAdjustment?: string;
  recurringCount: number;
  applied: boolean;
  createdAt: string;
}

export interface IncidentReport {
  id: string;
  reportTitle: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | string;
  totalIncidents: number;
  criticalCount: number;
  resolvedCount: number;
  summaryJson: string;
  generatedAt: string;
}

export const recommendationApi = {
  getRecommendations: async (type = 'all', namespace = 'all'): Promise<Recommendation[]> => {
    const response = await apiClient.get('/recommendations', { params: { type, namespace } });
    return response.data.data;
  },

  applyRecommendation: async (id: string): Promise<Recommendation> => {
    const response = await apiClient.put(`/recommendations/${id}/apply`);
    return response.data.data;
  },

  getReports: async (reportType = 'all'): Promise<IncidentReport[]> => {
    const response = await apiClient.get('/reports', { params: { reportType } });
    return response.data.data;
  },

  downloadCsv: (reportId: string) => {
    const url = `${apiClient.defaults.baseURL || 'http://localhost:8080/api/v1'}/reports/${reportId}/export/csv`;
    window.open(url, '_blank');
  },

  downloadPdf: (reportId: string) => {
    const url = `${apiClient.defaults.baseURL || 'http://localhost:8080/api/v1'}/reports/${reportId}/export/pdf`;
    window.open(url, '_blank');
  },
};
