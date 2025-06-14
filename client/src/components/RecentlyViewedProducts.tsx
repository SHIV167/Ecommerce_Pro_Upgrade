import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@shared/schema';
import ProductCard from './products/ProductCard';
import { fetchProductById } from '@/services/productService'; // Assuming this service exists

const RecentlyViewedProducts = () => {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    const storedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setViewedIds(storedIds);
  }, []);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['recentlyViewed', viewedIds],
    queryFn: async () => {
      if (viewedIds.length === 0) return [];
      const productPromises = viewedIds.map(id => fetchProductById(id));
      const resolvedProducts = await Promise.all(productPromises);
      // Filter out any products that might have failed to fetch (e.g., deleted products)
      return resolvedProducts.filter((p): p is Product => p !== null);
    },
    enabled: viewedIds.length > 0,
  });

  if (isLoading || !products || products.length === 0) {
    return null; // Don't render anything if there are no recently viewed items or it's loading
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Recently Viewed</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;
