import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Simple SVG icons
const TrashIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PencilIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

// Types
interface FeaturedProductVariant {
  size: string;
  price: number;
  isDefault: boolean;
  imageUrl?: string;
}

interface Stat {
  percent: number;
  text: string;
}

interface FeaturedProduct {
  productId: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  position: number;
  layout: 'image-left' | 'image-right';
  variants: FeaturedProductVariant[];
  benefits: string[];
  stats: Stat[];
  _id?: string;
}

interface ProductType {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
}

interface CategoryWithFeaturedProducts {
  _id?: string;
  id?: string;
  name: string;
  featuredProducts?: FeaturedProduct[];
}

const FeaturedProductsManager: React.FC<{ categoryId: string }> = ({ categoryId }) => {
  const queryClient = useQueryClient();
  const { toast: showToast } = useToast();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null); // now holds composite key 'productId-position'
  const [formData, setFormData] = useState<FeaturedProduct>({
    productId: '',
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    position: 1,
    layout: 'image-right',
    variants: [{ size: '', price: 0, isDefault: true, imageUrl: '' }],
    benefits: [''],
    stats: [{ percent: 0, text: '' }]
  });

  // Fetch category with featured products using dedicated endpoint
  const { data: category, isLoading: categoryLoading } = useQuery<CategoryWithFeaturedProducts>({
    queryKey: [`/api/categories/id/${categoryId}`],
    queryFn: async () => {
      try {
        console.log('Fetching category with ID using dedicated endpoint:', categoryId);
        
        // Use the new dedicated endpoint with cache busting
        const res = await apiRequest('GET', `/api/categories/id/${categoryId}?t=${Date.now()}`);
        
        console.log('Category API response status:', res.status);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch category: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Category data loaded from dedicated endpoint:', data);
        console.log('Featured products from API:', data.featuredProducts);
        
        // Ensure featuredProducts is always an array
        if (!data.featuredProducts) {
          console.warn('Featured products array is missing, initializing empty array');
          data.featuredProducts = [];
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching category:', error);
        
        // Only in case of error, return empty mock data
        return {
          _id: categoryId,
          name: 'Category',
          slug: 'category',
          featuredProducts: []
        };
      }
    },
    staleTime: 0, // Don't cache the data
    refetchInterval: 3000, // Refetch every 3 seconds
    refetchOnWindowFocus: true, // Refetch when window gets focus
    retry: 3, // Retry failed requests 3 times
    enabled: !!categoryId
  });

  // Fetch all products for dropdown
  const { data: productsData, isLoading: productsLoading } = useQuery<any>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      try {
        // Try main products endpoint
        const res = await apiRequest('GET', '/api/products');
        console.log('Products response:', res);
        return res.json();
      } catch (err) {
        console.error('Error fetching products:', err);
        // Create mock data if in development and API fails
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock product data for development');
          return {
            products: [
              { _id: 'test1', name: 'Test Product 1', price: 1000 },
              { _id: 'test2', name: 'Test Product 2', price: 2000 }
            ]
          };
        }
        return { products: [] };
      }
    },
  });

  // Process products data based on the actual API response structure
  const products: ProductType[] = React.useMemo(() => {
    if (!productsData) return [];
    
    // For debugging
    console.log('Products data structure:', productsData);
    
    // Handle different possible response formats
    if (Array.isArray(productsData)) {
      return productsData.map((p: any) => ({
        _id: p._id || p.id,
        id: p._id || p.id,
        name: p.name,
        slug: p.slug || '',
        price: p.price || 0,
        imageUrl: p.imageUrl || p.image
      }));
    }
    
    // If response is an object with a products array
    if (productsData.products && Array.isArray(productsData.products)) {
      return productsData.products.map((p: any) => ({
        _id: p._id || p.id,
        id: p._id || p.id,
        name: p.name,
        slug: p.slug || '',
        price: p.price || 0,
        imageUrl: p.imageUrl || p.image
      }));
    }
    
    // If response is an object with a data array
    if (productsData.data && Array.isArray(productsData.data)) {
      return productsData.data.map((p: any) => ({
        _id: p._id || p.id,
        id: p._id || p.id,
        name: p.name,
        slug: p.slug || '',
        price: p.price || 0,
        imageUrl: p.imageUrl || p.image
      }));
    }
    
    // If we need to create a fake product for testing
    if (process.env.NODE_ENV === 'development' && products.length === 0) {
      return [
        {
          _id: 'test1',
          id: 'test1',
          name: 'Test Product 1',
          slug: 'test-product-1',
          price: 1000,
          imageUrl: ''
        },
        {
          _id: 'test2',
          id: 'test2',
          name: 'Test Product 2',
          slug: 'test-product-2',
          price: 2000,
          imageUrl: ''
        }
      ];
    }
    
    return [];
  }, [productsData]);
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (updatedCategory: CategoryWithFeaturedProducts) => {
      console.log('Sending category update:', updatedCategory);
      const response = await apiRequest('PUT', `/api/admin/categories/${categoryId}`, { featuredProducts: updatedCategory.featuredProducts });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Category update success:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/categories/id/${categoryId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      showToast({ title: "Featured products updated successfully" });
      resetForm();
    },
    onError: () => {
      showToast({ title: "Failed to update featured products", variant: "destructive" });
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      productId: '',
      title: '',
      subtitle: '',
      description: '',
      imageUrl: '',
      position: category?.featuredProducts?.length ? category.featuredProducts.length + 1 : 1,
      layout: 'image-right',
      variants: [{ size: '', price: 0, isDefault: true, imageUrl: '' }],
      benefits: [''],
      stats: [{ percent: 0, text: '' }]
    });
    setIsAddingProduct(false);
    setIsEditingProduct(null);
  };

  // Handle edit product
  const handleEditProduct = (product: FeaturedProduct) => {
    console.log('Editing product:', product);
    
    // Ensure we have default values for all form fields
    setFormData({
      productId: product.productId || '',
      title: product.title || '',
      subtitle: product.subtitle || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      position: product.position || 1,
      layout: product.layout || 'image-right',
      // Ensure variants has at least one item
      variants: product.variants?.length ? 
        product.variants.map(v => ({ 
          size: v.size || 'Default', 
          price: v.price || 0, 
          isDefault: v.isDefault || false,
          imageUrl: v.imageUrl || ''
        })) : 
        [{ size: 'Default', price: 0, isDefault: true, imageUrl: '' }],
      // Ensure benefits is an array
      benefits: product.benefits?.length ? product.benefits : [''],
      // Ensure stats has at least one item
      stats: product.stats?.length ? 
        product.stats.map(s => ({ percent: s.percent || 0, text: s.text || '' })) : 
        [{ percent: 0, text: '' }]
    });
    
    // Set editing state
    setIsEditingProduct(`${product.productId}-${product.position}`);
    setIsAddingProduct(true);
  };

  // Handle delete product - simplified direct approach
  const handleDeleteProduct = (productKey: string) => {
    if (!category || !category.featuredProducts) return;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this featured product?')) {
      return;
    }
    
    // Create a copy of the current list without the product to delete
    const updatedProducts = category.featuredProducts.filter(
      (product) => `${product.productId}-${product.position}` !== productKey
    );
    
    console.log('Removing product ID:', productKey);
    console.log('New product count:', updatedProducts.length);
    
    // Use the mutation directly to update the category
    updateCategoryMutation.mutate({
      ...category,
      featuredProducts: updatedProducts
    }, {
      onSuccess: () => {
        showToast({
          title: "Product deleted",
          variant: "default"
        });
        
        // Force refetch
        queryClient.invalidateQueries({ queryKey: [`/api/categories/id/${categoryId}`] });
      },
      onError: (error: any) => {
        console.error('Delete error:', error);
        showToast({
          title: "Error deleting product",
          description: error.message || 'Unknown error',
          variant: "destructive"
        });
      }
    });
  };


  // Handle form submit with ultra-simplified approach
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      showToast({ 
        title: "Error", 
        description: "Category data not loaded",
        variant: "destructive" 
      });
      return;
    }
    
    // Validate basic required fields only
    if (!formData.productId || !formData.title) {
      showToast({
        title: "Error",
        description: "Product ID and title are required",
        variant: "destructive"
      });
      return;
    }
    
    // Create a complete version of the form data
    const productData = {
      productId: formData.productId,
      title: formData.title,
      subtitle: formData.subtitle || '',
      description: formData.description || '',
      imageUrl: formData.imageUrl || '',
      position: formData.position || 1,
      layout: formData.layout || 'image-right',
      variants: formData.variants?.length ? formData.variants : [{
        size: 'Default',
        price: 0,
        isDefault: true,
        imageUrl: ''
      }],
      benefits: formData.benefits || [],
      stats: formData.stats || []
    };
    
    // Show loading toast
    showToast({
      title: isEditingProduct ? "Updating product..." : "Adding product...",
      variant: "default"
    });
    
    // Check if we're editing or adding
    console.log('Mode:', isEditingProduct ? 'Editing existing product' : 'Adding new product');
    console.log('Sending product data:', productData);
    
    // Get current list of featured products
    const currentProducts = category.featuredProducts || [];
    
    // Create updated list based on whether we're editing or adding
    let updatedProducts;
    if (isEditingProduct) {
      // If editing, replace the existing product with the updated one
      updatedProducts = currentProducts.map(p =>
        `${p.productId}-${p.position}` === isEditingProduct ? productData : p
      );
      console.log('Updating existing product in list');
    } else {
      // If adding, append to the list
      updatedProducts = [...currentProducts, productData];
      console.log('Adding new product to list');
    }
    
    // Update category via mutation
    updateCategoryMutation.mutate({
      ...category,
      featuredProducts: updatedProducts
    });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types correctly
    if (type === 'number') {
      // Convert to number or use 0 if empty/invalid
      const numValue = value === '' ? '' : Number(value);
      // Prevent NaN values
      if (!isNaN(numValue as number)) {
        setFormData((prev) => ({ ...prev, [name]: numValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle product selection
  const handleProductSelect = (value: string) => {
    const productId = value;
    const selectedProduct = products?.find((p) => p._id === productId || p.id === productId);
    
    if (selectedProduct) {
      setFormData((prev) => ({
        ...prev,
        productId,
        title: selectedProduct.name,
        imageUrl: selectedProduct.imageUrl || '',
        variants: [
          { 
            size: 'Default', 
            price: selectedProduct.price, 
            isDefault: true,
            imageUrl: selectedProduct.imageUrl || ''
          }
        ],
      }));
    }
  };

  // Handle variant changes
  const handleVariantChange = (index: number, field: keyof FeaturedProductVariant, value: string | number | boolean) => {
    const updatedVariants = [...formData.variants];
    
    // Handle price field specially to prevent NaN
    if (field === 'price') {
      const numValue = value === '' ? 0 : Number(value);
      if (!isNaN(numValue)) {
        updatedVariants[index] = { 
          ...updatedVariants[index], 
          [field]: numValue
        };
      }
    } else {
      updatedVariants[index] = { 
        ...updatedVariants[index], 
        [field]: value 
      };
    }
    
    // If setting a variant as default, make sure others are not default
    if (field === 'isDefault' && value === true) {
      updatedVariants.forEach((variant, i) => {
        if (i !== index) variant.isDefault = false;
      });
    }
    
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  // Add new variant
  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { size: '', price: 0, isDefault: false, imageUrl: '' }]
    }));
  };

  // Remove variant
  const removeVariant = (index: number) => {
    const updatedVariants = [...formData.variants];
    updatedVariants.splice(index, 1);
    
    // If removing the default variant, set the first one as default
    if (formData.variants[index].isDefault && updatedVariants.length) {
      updatedVariants[0].isDefault = true;
    }
    
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  // Handle stat changes
  const handleStatChange = (index: number, field: keyof Stat, value: string | number) => {
    const updatedStats = [...formData.stats];
    
    // Handle percent field specially to prevent NaN
    if (field === 'percent') {
      const numValue = value === '' ? 0 : Number(value);
      if (!isNaN(numValue)) {
        updatedStats[index] = { 
          ...updatedStats[index], 
          [field]: numValue
        };
      }
    } else if (field === 'text') {
      // Ensure text is always a string
      updatedStats[index] = { 
        ...updatedStats[index], 
        text: String(value) 
      };
    }
    
    setFormData((prev) => ({ ...prev, stats: updatedStats }));
  };

  // Add new stat
  const addStat = () => {
    setFormData((prev) => ({
      ...prev,
      stats: [...prev.stats, { percent: 0, text: '' }]
    }));
  };

  // Remove stat
  const removeStat = (index: number) => {
    const updatedStats = [...formData.stats];
    updatedStats.splice(index, 1);
    setFormData((prev) => ({ ...prev, stats: updatedStats }));
  };

  // Handle benefit changes
  const handleBenefitChange = (index: number, value: string) => {
    const updatedBenefits = [...(formData.benefits || [''])];
    updatedBenefits[index] = value;
    setFormData((prev) => ({ ...prev, benefits: updatedBenefits }));
  };

  // Add new benefit
  const addBenefit = () => {
    setFormData((prev) => ({
      ...prev,
      benefits: [...(prev.benefits || []), '']
    }));
  };

  // Remove benefit
  const removeBenefit = (index: number) => {
    const updatedBenefits = [...(formData.benefits || [])];
    updatedBenefits.splice(index, 1);
    setFormData((prev) => ({ ...prev, benefits: updatedBenefits }));
  };

  if (categoryLoading || productsLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card className="max-h-[70vh] overflow-auto">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-6">Manage Featured Products</h2>
        
        {/* Featured Products List */}
        {!isAddingProduct && (
          <>
            <div className="mb-6">
              <Button
                onClick={() => setIsAddingProduct(true)}
                className="flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Featured Product
              </Button>
            </div>

            {category?.featuredProducts && category.featuredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">Pos</th>
                      <th className="py-2 text-left font-medium">Product</th>
                      <th className="py-2 text-left font-medium">Layout</th>
                      <th className="py-2 text-left font-medium">Variants</th>
                      <th className="py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(category.featuredProducts || [])]
                      .sort((a, b) => a.position - b.position)
                      .map((product) => (
                        <tr key={product.productId + '-' + product.position} className="border-b">
                          <td className="py-3">{product.position}</td>
                          <td className="py-3">
                            <div className="flex items-center">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="h-8 w-8 object-cover mr-2 rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium">{product.title}</div>
                                <div className="text-sm text-muted-foreground">{product.subtitle}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            {product.layout === 'image-right' ? 'Image Right' : 'Image Left'}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {product.variants.map((v) => (
                                <span
                                  key={v.size}
                                  className="inline-block bg-slate-100 px-2 py-1 text-xs rounded"
                                >
                                  {v.size}: ₹{v.price.toLocaleString('en-IN')}
                                  {v.isDefault && ' ✓'}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3">
                            <Button
                              onClick={() => handleEditProduct(product)}
                              variant="outline"
                              size="sm"
                              className="mr-2"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteProduct(product.productId + '-' + product.position)}
                              variant="destructive"
                              size="sm"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No featured products added yet. Add your first featured product!
              </div>
            )}
          </>
        )}

        {/* Add/Edit Form */}
        {isAddingProduct && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="product">Select Product</Label>
                <Select
                  value={formData.productId}
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products && products.length > 0 ? (
                      products.map((product) => (
                        <SelectItem 
                          key={product._id || product.id} 
                          value={product._id || product.id || ''}
                        >
                          {product.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-products" disabled>
                        No products available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  type="number"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  type="text"
                  name="subtitle"
                  value={formData.subtitle || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="layout">Layout</Label>
                <Select
                  value={formData.layout}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, layout: value as 'image-right' | 'image-left' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image-right">Image Right</SelectItem>
                    <SelectItem value="image-left">Image Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Variants Section */}
            <div className="mt-3">
              <h3 className="text-md font-medium mb-2">Product Variants</h3>
              
              {formData.variants.map((variant, index) => (
                <div key={index} className="flex items-center space-x-4 mb-3">
                  <div className="flex-1">
                    <Label>Size</Label>
                    <Input
                      type="text"
                      value={variant.size}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(index, 'size', e.target.value)}
                      placeholder="e.g. 30ml"
                      required
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={variant.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(index, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Label>Variant Image URL</Label>
                    <Input
                      type="text"
                      value={variant.imageUrl || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(index, 'imageUrl', e.target.value)}
                      placeholder="Image URL for this variant"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Label className="mb-2 block">Default</Label>
                    <Switch
                      checked={variant.isDefault}
                      onCheckedChange={(checked) => handleVariantChange(index, 'isDefault', checked)}
                    />
                  </div>
                  
                  <div className="flex items-end pt-6">
                    <Button
                      type="button"
                      onClick={() => removeVariant(index)}
                      disabled={formData.variants.length <= 1}
                      variant="ghost"
                      size="icon"
                      className={formData.variants.length <= 1 ? "text-gray-400 cursor-not-allowed" : "text-red-600"}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                onClick={addVariant}
                variant="outline"
                size="sm"
                className="mt-2 flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Variant
              </Button>
            </div>

            {/* Stats Section */}
            <div className="mt-3">
              <h3 className="text-md font-medium mb-2">Product Stats</h3>
              
              {formData.stats.map((stat, index) => (
                <div key={index} className="flex items-center space-x-4 mb-3">
                  <div className="w-24">
                    <Label>Percent</Label>
                    <Input
                      type="number"
                      value={stat.percent}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStatChange(index, 'percent', e.target.value)}
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Label>Description</Label>
                    <Input
                      type="text"
                      value={stat.text}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStatChange(index, 'text', e.target.value)}
                      placeholder="e.g. Reported smoother skin"
                      required
                    />
                  </div>
                  
                  <div className="flex items-end pt-6">
                    <Button
                      type="button"
                      onClick={() => removeStat(index)}
                      disabled={formData.stats.length <= 1}
                      variant="ghost"
                      size="icon"
                      className={formData.stats.length <= 1 ? "text-gray-400 cursor-not-allowed" : "text-red-600"}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                onClick={addStat}
                variant="outline"
                size="sm"
                className="mt-2 flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Stat
              </Button>
            </div>

            {/* Benefits Section */}
            <div className="mt-3">
              <h3 className="text-md font-medium mb-2">Product Benefits (Optional)</h3>
              
              {formData.benefits?.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-4 mb-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={benefit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBenefitChange(index, e.target.value)}
                      placeholder="e.g. Reduces fine lines and wrinkles"
                    />
                  </div>
                  
                  <div>
                    <Button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      disabled={(formData.benefits?.length || 0) <= 1}
                      variant="ghost"
                      size="icon"
                      className={(formData.benefits?.length || 0) <= 1 ? "text-gray-400 cursor-not-allowed" : "text-red-600"}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                onClick={addBenefit}
                variant="outline"
                size="sm"
                className="mt-2 flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Benefit
              </Button>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending ? 'Saving...' : isEditingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default FeaturedProductsManager;
