import { queryClient } from '@/lib/queryClient';

export const invalidateProductQueries = () => {
  // Invalidate all product-related queries
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['/api/products'] }),
    queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] }),
    queryClient.invalidateQueries({ queryKey: ['/api/products/bestsellers'] }),
    queryClient.invalidateQueries({ queryKey: ['/api/products/new-arrivals'] }),
  ]);
};

export const invalidateProductCache = async (productId?: string) => {
  if (productId) {
    // Invalidate specific product
    await queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
  }
  // Invalidate all product listings
  await invalidateProductQueries();
};
