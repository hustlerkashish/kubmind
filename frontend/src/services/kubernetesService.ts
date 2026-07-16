import { apiClient } from './apiClient';

export interface K8sCluster {
  clusterName: string;
  serverUrl: string;
  currentContext: string;
  kubernetesVersion: string;
  status: string;
  connected: boolean;
  totalNodes: number;
  totalPods: number;
}

export interface K8sPod {
  name: string;
  namespace: string;
  status: string;
  podIP: string;
  hostIP: string;
  nodeName: string;
  restartCount: number;
  creationTimestamp: string;
  containers: string;
}

export interface K8sDeployment {
  name: string;
  namespace: string;
  desiredReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  status: string;
  image: string;
  creationTimestamp: string;
}

export interface K8sService {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIP: string;
  ports: string;
  creationTimestamp: string;
}

export interface K8sNode {
  name: string;
  status: string;
  role: string;
  kubeletVersion: string;
  internalIP: string;
  cpuCapacity: string;
  memoryCapacity: string;
  creationTimestamp: string;
}

export interface K8sNamespace {
  name: string;
  status: string;
  creationTimestamp: string;
}

export interface K8sEvent {
  id: string;
  type: string;
  reason: string;
  message: string;
  involvedObject: string;
  namespace: string;
  count: string;
  lastTimestamp: string;
}

export const kubernetesApi = {
  getClusterSummary: async (): Promise<K8sCluster> => {
    const response = await apiClient.get('/k8s/clusters');
    return response.data.data;
  },
  getPods: async (namespace = 'all'): Promise<K8sPod[]> => {
    const response = await apiClient.get('/k8s/pods', { params: { namespace } });
    return response.data.data;
  },
  getDeployments: async (namespace = 'all'): Promise<K8sDeployment[]> => {
    const response = await apiClient.get('/k8s/deployments', { params: { namespace } });
    return response.data.data;
  },
  getServices: async (namespace = 'all'): Promise<K8sService[]> => {
    const response = await apiClient.get('/k8s/services', { params: { namespace } });
    return response.data.data;
  },
  getNodes: async (): Promise<K8sNode[]> => {
    const response = await apiClient.get('/k8s/nodes');
    return response.data.data;
  },
  getNamespaces: async (): Promise<K8sNamespace[]> => {
    const response = await apiClient.get('/k8s/namespaces');
    return response.data.data;
  },
  getEvents: async (namespace = 'all'): Promise<K8sEvent[]> => {
    const response = await apiClient.get('/k8s/events', { params: { namespace } });
    return response.data.data;
  },
};
