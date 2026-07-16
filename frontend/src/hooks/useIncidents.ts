import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentApi } from '@/services/incidentService';

export function useIncidents(status = 'all', namespace = 'all') {
  return useQuery({
    queryKey: ['incidents', status, namespace],
    queryFn: () => incidentApi.getIncidents(status, namespace),
    refetchInterval: 10000,
  });
}

export function useIncidentDetail(id?: string) {
  return useQuery({
    queryKey: ['incidents', id],
    queryFn: () => (id ? incidentApi.getIncidentById(id) : null),
    enabled: !!id,
  });
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      incidentApi.updateIncidentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function usePodLogs(namespace: string, podName: string, container?: string, tailLines = 100) {
  return useQuery({
    queryKey: ['podLogs', namespace, podName, container, tailLines],
    queryFn: () => incidentApi.getPodLogs(namespace, podName, container, tailLines),
    refetchInterval: 4000,
  });
}
