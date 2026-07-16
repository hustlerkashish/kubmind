import { useQuery } from '@tanstack/react-query';
import { prometheusApi } from '@/services/prometheusService';

export function useCpuMetrics(range = '1h', enabled = true) {
  return useQuery({
    queryKey: ['prometheus', 'cpu', range],
    queryFn: () => prometheusApi.getCpuMetrics(range),
    refetchInterval: enabled ? 5000 : false, // 5s Auto-refresh
  });
}

export function useMemoryMetrics(range = '1h', enabled = true) {
  return useQuery({
    queryKey: ['prometheus', 'memory', range],
    queryFn: () => prometheusApi.getMemoryMetrics(range),
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useNetworkMetrics(range = '1h', enabled = true) {
  return useQuery({
    queryKey: ['prometheus', 'network', range],
    queryFn: () => prometheusApi.getNetworkMetrics(range),
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useDiskMetrics(range = '1h', enabled = true) {
  return useQuery({
    queryKey: ['prometheus', 'disk', range],
    queryFn: () => prometheusApi.getDiskMetrics(range),
    refetchInterval: enabled ? 5000 : false,
  });
}

export function usePodMetrics(range = '1h', enabled = true) {
  return useQuery({
    queryKey: ['prometheus', 'pods', range],
    queryFn: () => prometheusApi.getPodMetrics(range),
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useNodeMetrics(range = '1h', enabled = true) {
  return useQuery({
    queryKey: ['prometheus', 'nodes', range],
    queryFn: () => prometheusApi.getNodeMetrics(range),
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useGrafanaPanels() {
  return useQuery({
    queryKey: ['prometheus', 'grafana'],
    queryFn: prometheusApi.getGrafanaPanels,
  });
}
