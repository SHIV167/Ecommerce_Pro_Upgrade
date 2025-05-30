import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface PromoMessage { message: string }

export const usePromoMessage = (cartTotal: number): UseQueryResult<PromoMessage[], Error> =>
  useQuery<PromoMessage[], Error>({
    queryKey: ['promomessages', cartTotal],
    queryFn: async (): Promise<PromoMessage[]> => {
      const res = await apiRequest('GET', `/api/promomessages?cartTotal=${cartTotal}`);
      return (await res.json()) as PromoMessage[];
    },
    staleTime: 5 * 60 * 1000,
  });
