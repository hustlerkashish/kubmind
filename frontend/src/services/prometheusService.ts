import { apiClient } from './apiClient';

export interface MetricDatapoint {
  timestamp: string;
  value: number;
}

export interface MetricSeries {
  metricName: string;
  target: string;
  unit: string;
  datapoints: MetricDatapoint[];
}

export interface PrometheusQueryResult {
  queryType: string;
  range: string;
  livePrometheusConnected: boolean;
  series: MetricSeries[];
}

export interface GrafanaEmbed {
  title: string;
  panelId: string;
  dashboardUid: string;
  embedUrl: string;
  description: string;
}

export const prometheusApi = {
  getCpuMetrics: async (range = '1h'): Promise<PrometheusQueryResult> => {
    const response = await apiClient.get('/metrics/cpu', { params: { range } });
    return response.data.data;
  },
  getMemoryMetrics: async (range = '1h'): Promise<PrometheusQueryResult> => {
    const response = await apiClient.get('/metrics/memory', { params: { range } });
    return response.data.data;
  },
  getNetworkMetrics: async (range = '1h'): Promise<PrometheusQueryResult> => {
    const response = await apiClient.get('/metrics/network', { params: { range } });
    return response.data.data;
  },
  getDiskMetrics: async (range = '1h'): Promise<PrometheusQueryResult> => {
    const response = await apiClient.get('/metrics/disk', { params: { range } });
    return response.data.data;
  },
  getPodMetrics: async (range = '1h'): Promise<PrometheusQueryResult> => {
    const response = await apiClient.get('/metrics/pods', { params: { range } });
    return response.data.data;
  },
  getNodeMetrics: async (range = '1h'): Promise<PrometheusQueryResult> => {
    const response = await apiClient.get('/metrics/nodes', { params: { range } });
    return response.data.data;
  },
  getGrafanaPanels: async (): Promise<GrafanaEmbed[]> => {
    const response = await apiClient.get('/metrics/grafana-embed');
    return response.data.data;
  },
};
