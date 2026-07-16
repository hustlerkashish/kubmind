import { useQuery } from '@tanstack/react-query';
import { kubernetesApi } from '@/services/kubernetesService';

export function useClusterSummary() {
  return useQuery({
    queryKey: ['k8s', 'cluster'],
    queryFn: kubernetesApi.getClusterSummary,
    refetchInterval: 10000,
  });
}

export function usePods(namespace = 'all') {
  return useQuery({
    queryKey: ['k8s', 'pods', namespace],
    queryFn: () => kubernetesApi.getPods(namespace),
    refetchInterval: 5000,
  });
}

export function useDeployments(namespace = 'all') {
  return useQuery({
    queryKey: ['k8s', 'deployments', namespace],
    queryFn: () => kubernetesApi.getDeployments(namespace),
    refetchInterval: 10000,
  });
}

export function useServices(namespace = 'all') {
  return useQuery({
    queryKey: ['k8s', 'services', namespace],
    queryFn: () => kubernetesApi.getServices(namespace),
    refetchInterval: 15000,
  });
}

export function useNodes() {
  return useQuery({
    queryKey: ['k8s', 'nodes'],
    queryFn: kubernetesApi.getNodes,
    refetchInterval: 15000,
  });
}

export function useNamespaces() {
  return useQuery({
    queryKey: ['k8s', 'namespaces'],
    queryFn: kubernetesApi.getNamespaces,
    refetchInterval: 30000,
  });
}

export function useEvents(namespace = 'all') {
  return useQuery({
    queryKey: ['k8s', 'events', namespace],
    queryFn: () => kubernetesApi.getEvents(namespace),
    refetchInterval: 5000,
  });
}
