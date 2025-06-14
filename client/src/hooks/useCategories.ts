import { useQuery } from '@tanstack/react-query';

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['/api/categories'],
    // The query function is not needed here because it's configured globally in queryClient
  });
};

