import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationApi } from '@/services/recommendationService';

export function useRecommendations(type = 'all', namespace = 'all') {
  return useQuery({
    queryKey: ['recommendations', type, namespace],
    queryFn: () => recommendationApi.getRecommendations(type, namespace),
    refetchInterval: 10000,
  });
}

export function useApplyRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recommendationApi.applyRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}

export function useReports(reportType = 'all') {
  return useQuery({
    queryKey: ['reports', reportType],
    queryFn: () => recommendationApi.getReports(reportType),
    refetchInterval: 15000,
  });
}
