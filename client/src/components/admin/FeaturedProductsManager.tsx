import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Simple SVG icons instead of heroicons
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
}

interface Stat {
  percent: number;
  text: string;
}

interface FeaturedProduct {
  productId: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  position: number;
  layout: 'image-right' | 'image-left';
  variants: FeaturedProductVariant[];
  benefits?: string[];
  stats: Stat[];
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
}

interface CategoryWithFeaturedProducts {
  _id: string;
  name: string;
  featuredProducts?: FeaturedProduct[];
}

const FeaturedProductsManager: React.FC<{ categoryId: string }> = ({ categoryId }) => {
  const queryClient = useQueryClient();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeaturedProduct>({
    productId: '',
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    position: 1,
    layout: 'image-right',
    variants: [{ size: '', price: 0, isDefault: true }],
    benefits: [''],
    stats: [{ percent: 0, text: '' }]
  });

  // Fetch category with featured products
  const { data: category, isLoading: categoryLoading } = useQuery<CategoryWithFeaturedProducts>({
    queryKey: [`/api/categories/${categoryId}`],
    enabled: !!categoryId,
  });

  // Fetch all products for dropdown
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (updatedCategory: CategoryWithFeaturedProducts) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCategory),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update category');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${categoryId}`] });
      toast.success('Featured products updated successfully');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update featured products');
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
      variants: [{ size: '', price: 0, isDefault: true }],
      benefits: [''],
      stats: [{ percent: 0, text: '' }]
    });
    setIsAddingProduct(false);
    setIsEditingProduct(null);
  };

  // Handle edit product
  const handleEditProduct = (product: FeaturedProduct) => {
    setFormData({
      ...product,
      benefits: product.benefits?.length ? product.benefits : [''],
    });
    setIsEditingProduct(product.productId);
    setIsAddingProduct(true);
  };

  // Handle delete product
  const handleDeleteProduct = (productId: string) => {
    if (!category || !category.featuredProducts) return;
    
    const updatedFeaturedProducts = category.featuredProducts.filter(
      (product) => product.productId !== productId
    );
    
    updateCategoryMutation.mutate({
      ...category,
      featuredProducts: updatedFeaturedProducts
    });
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) return;
    
    let updatedFeaturedProducts = [...(category.featuredProducts || [])];
    
    if (isEditingProduct) {
      // Update existing product
      updatedFeaturedProducts = updatedFeaturedProducts.map((product) =>
        product.productId === isEditingProduct ? formData : product
      );
    } else {
      // Add new product
      updatedFeaturedProducts.push(formData);
    }
    
    updateCategoryMutation.mutate({
      ...category,
      featuredProducts: updatedFeaturedProducts
    });
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle product selection
  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    const selectedProduct = products?.find((p) => p._id === productId);
    
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
            isDefault: true 
          }
        ],
      }));
    }
  };

  // Handle variant changes
  const handleVariantChange = (index: number, field: keyof FeaturedProductVariant, value: string | number | boolean) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = { 
      ...updatedVariants[index], 
      [field]: field === 'price' ? parseFloat(value as string) : value 
    };
    
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
      variants: [...prev.variants, { size: '', price: 0, isDefault: false }]
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
    updatedStats[index] = { 
      ...updatedStats[index], 
      [field]: field === 'percent' ? parseInt(value as string) : value 
    };
    
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Featured Products</h2>
      
      {/* Featured Products List */}
      {!isAddingProduct && (
        <>
          <div className="mb-6">
            <button
              onClick={() => setIsAddingProduct(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-1" />
              Add Featured Product
            </button>
          </div>

          {category?.featuredProducts && category.featuredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Layout</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...(category.featuredProducts || [])]
                    .sort((a, b) => a.position - b.position)
                    .map((product) => (
                      <tr key={product.productId}>
                        <td className="px-6 py-4 whitespace-nowrap">{product.position}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="h-10 w-10 object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{product.title}</div>
                              <div className="text-gray-500 text-sm">{product.subtitle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.layout}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.variants.map((v) => (
                            <span
                              key={v.size}
                              className="inline-block bg-gray-100 px-2 py-1 text-xs rounded mr-1 mb-1"
                            >
                              {v.size}: ₹{v.price.toLocaleString('en-IN')}
                              {v.isDefault && ' (Default)'}
                            </span>
                          ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.productId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No featured products added yet. Add your first featured product!
            </div>
          )}
        </>
      )}

      {/* Add/Edit Form */}
      {isAddingProduct && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Product
              </label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleProductSelect}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select a product</option>
                {products?.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="number"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Layout
              </label>
              <select
                name="layout"
                value={formData.layout}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="image-right">Image Right</option>
                <option value="image-left">Image Left</option>
              </select>
            </div>
          </div>

          {/* Variants Section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3">Product Variants</h3>
            
            {formData.variants.map((variant, index) => (
              <div key={index} className="flex items-center space-x-4 mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={variant.size}
                    onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g. 30ml"
                    required
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default
                  </label>
                  <div className="flex items-center h-10">
                    <input
                      type="checkbox"
                      checked={variant.isDefault}
                      onChange={(e) => handleVariantChange(index, 'isDefault', e.target.checked)}
                      className="h-4 w-4 border-gray-300 rounded text-indigo-600"
                    />
                  </div>
                </div>
                
                <div className="flex items-end h-16">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    disabled={formData.variants.length <= 1}
                    className={`p-2 rounded ${
                      formData.variants.length <= 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addVariant}
              className="mt-2 text-sm flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Variant
            </button>
          </div>

          {/* Stats Section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3">Product Stats</h3>
            
            {formData.stats.map((stat, index) => (
              <div key={index} className="flex items-center space-x-4 mb-3">
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Percent
                  </label>
                  <input
                    type="number"
                    value={stat.percent}
                    onChange={(e) => handleStatChange(index, 'percent', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={stat.text}
                    onChange={(e) => handleStatChange(index, 'text', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g. Reported smoother skin"
                    required
                  />
                </div>
                
                <div className="flex items-end h-16">
                  <button
                    type="button"
                    onClick={() => removeStat(index)}
                    disabled={formData.stats.length <= 1}
                    className={`p-2 rounded ${
                      formData.stats.length <= 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addStat}
              className="mt-2 text-sm flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Stat
            </button>
          </div>

          {/* Benefits Section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3">Product Benefits (Optional)</h3>
            
            {formData.benefits?.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-4 mb-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => handleBenefitChange(index, e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g. Reduces fine lines and wrinkles"
                  />
                </div>
                
                <div>
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    disabled={(formData.benefits?.length || 0) <= 1}
                    className={`p-2 rounded ${
                      (formData.benefits?.length || 0) <= 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addBenefit}
              className="mt-2 text-sm flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Benefit
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? 'Saving...' : isEditingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FeaturedProductsManager;
