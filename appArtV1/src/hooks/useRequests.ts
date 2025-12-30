import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateRequestData, Request } from '../types/api';
import api from '../services/api';

export const useCreateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData: CreateRequestData): Promise<Request> => {
      const response = await api.post<Request>('/requests/', requestData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate requests list
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
    },
    onError: (error) => {
      console.error('Create request error:', error);
    },
  });
};

export const useMyRequests = (enabled: boolean = true) => {
  return useQuery<Request[]>({
    queryKey: ['myRequests'],
    queryFn: async () => {
      const response = await api.get<Request[]>('/requests/my-requests');
      return response.data;
    },
    enabled,
  });
};

export const useOpenRequests = (enabled: boolean = true) => {
  return useQuery<Request[]>({
    queryKey: ['openRequests'],
    queryFn: async () => {
      const response = await api.get<Request[]>('/requests/open');
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRequestDetails = (requestId: number) => {
  return useQuery({
    queryKey: ['request', requestId],
    queryFn: async (): Promise<Request> => {
      const response = await api.get<Request>(`/requests/${requestId}`);
      return response.data;
    },
    enabled: !!requestId,
  });
};

export const useSelectArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, offerId }: { requestId: number; offerId: number }) => {
      const response = await api.put(`/requests/${requestId}/select-artist/${offerId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      queryClient.invalidateQueries({ queryKey: ['request'] });
    },
    onError: (error) => {
      console.error('Select artist error:', error);
    },
  });
};
