import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateOfferData, Offer, OfferWithArtist } from '../types/api';
import api from '../services/api';

export const useRequestOffers = (requestId: number, enabled: boolean = true) => {
  return useQuery<OfferWithArtist[]>({
    queryKey: ['offers', requestId],
    queryFn: async () => {
      // Backend router: /offers/request/{request_id}
      const response = await api.get<OfferWithArtist[]>(`/offers/request/${requestId}`);
      return response.data;
    },
    enabled: enabled && !!requestId,
  });
};

export const useCreateOffer = (requestId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerData: CreateOfferData): Promise<Offer> => {
      // Backend router: /offers/request/{request_id}
      const response = await api.post<Offer>(`/offers/request/${requestId}`, offerData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    },
  });
};

export const useMyOffers = (enabled: boolean = true) => {
  return useQuery<OfferWithArtist[]>({
    queryKey: ['myOffers'],
    queryFn: async () => {
      const response = await api.get<OfferWithArtist[]>(`/offers/my-offers`);
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
