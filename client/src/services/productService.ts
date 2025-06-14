import { Product } from '@shared/schema';

export const fetchProductById = async (id: string): Promise<Product | null> => {
  try {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) {
      // If the product is not found or there's a server error, return null
      console.error(`Failed to fetch product with id ${id}: ${response.statusText}`);
      return null;
    }
    const product = await response.json();
    return product;
  } catch (error) {
    console.error(`An error occurred while fetching product with id ${id}:`, error);
    return null;
  }
};
