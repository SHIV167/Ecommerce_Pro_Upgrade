import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProductCard from '@/components/products/ProductCard';
import { useToast } from '@/hooks/use-toast';

export default function WishlistPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // guard before fetching
  if (authLoading || !isAuthenticated || !user) return null;

  const { data: products = [], isLoading, isError } = useQuery<any[], Error, any[]>({
    queryKey: ['wishlist', user.id],
    queryFn: async () => {
      const res = await axios.get(`/api/users/${user.id}/wishlist`);
      return res.data;
    },
  });

  useEffect(() => {
    if (isError) toast({ title: 'Failed to load wishlist', variant: 'destructive' });
  }, [isError, toast]);

  return (
    <>
      <Helmet>
        <title>My Wishlist | Kama Ayurveda</title>
        <meta name="description" content="Your wishlist items." />
      </Helmet>
      <div className="container mx-auto py-12">
        <h1 className="font-heading text-3xl text-primary mb-6">My Wishlist</h1>
        {isLoading ? (
          <p>Loading...</p>
        ) : isError ? (
          <p>Error loading wishlist.</p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <p>Your wishlist is empty.</p>
        )}
      </div>
    </>
  );
}
