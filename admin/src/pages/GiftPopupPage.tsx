import { useState, useEffect, ChangeEvent } from 'react';
import { put } from '@/lib/apiUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import ProductSelector from '@/components/ProductSelector';
import { formatCurrency } from '@/lib/utils';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
}

interface GiftPopupConfig {
  _id?: string;
  title: string;
  subTitle: string;
  active: boolean;
  minCartValue: number;
  maxCartValue: number | null;
  maxSelectableGifts: number;
  giftProducts: string[];
}

// Base API URL for backend
const API_BASE = import.meta.env.VITE_API_URL || '';

export default function GiftPopupPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<GiftPopupConfig>({
    title: 'Claim Your Complimentary Gift',
    subTitle: 'Choose Any 2',
    active: false,
    minCartValue: 1000,
    maxCartValue: null,
    maxSelectableGifts: 2,
    giftProducts: []
  });

  // Load configuration and products
  useEffect(() => {
    loadConfig();
    loadProducts();
  }, []);

  // Update selected products when config.giftProducts changes
  useEffect(() => {
    const updateSelectedProducts = async () => {
      if (config.giftProducts.length > 0 && products.length > 0) {
        const selected = products.filter(product => 
          config.giftProducts.includes(product._id)
        );
        setSelectedProducts(selected);
      } else {
        setSelectedProducts([]);
      }
    };

    updateSelectedProducts();
  }, [config.giftProducts, products]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      console.log('Fetching gift popup configuration...');
      // Try the authenticated endpoint first, fall back to dev endpoint in development
      let endpoint = '/api/admin/gift-popup';
      
      // In development, we might want to use the dev endpoint
      if (import.meta.env.DEV) {
        endpoint = '/api/dev/gift-popup';
      }
      
      const response = await fetch(`${API_BASE}${endpoint}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response: not JSON');
      }
      
      const data = await response.json();
      console.log('Gift popup config API response:', data);
      
      // Validate the response as a GiftPopupConfig
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid gift popup config: not an object');
      }

      // Extract the GiftPopupConfig from the response
      // The API might return the config directly or within a data property
      const configData = data.data || data;
      
      // Validate required fields
      if (typeof configData.title !== 'string') {
        console.error('Missing title in config:', configData);
        throw new Error('Invalid config: missing title');
      }
      
      if (typeof configData.minCartValue !== 'number') {
        console.error('Missing minCartValue in config:', configData);
        throw new Error('Invalid config: missing minCartValue');
      }
      
      if (!Array.isArray(configData.giftProducts)) {
        console.error('giftProducts is not an array:', configData);
        configData.giftProducts = []; // Fix the giftProducts field if missing
      }
      
      console.log('Setting gift popup config:', configData);
      setConfig(configData);
    } catch (error: any) {
      console.error('Error loading gift popup config:', error);
      toast({
        title: 'Failed to load gift popup configuration',
        description: error.message || 'Please try refreshing the page',
        variant: 'destructive'
      });
      
      // Set default values to prevent UI from breaking
      setConfig({
        title: 'Claim Your Complimentary Gift',
        subTitle: 'Choose Any 2',
        active: false,
        minCartValue: 1000,
        maxCartValue: null,
        maxSelectableGifts: 2,
        giftProducts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Fetching available products...');
      setLoading(true);
      // Try the authenticated endpoint first, fall back to dev endpoint in development
      let endpoint = '/api/admin/gift-products';
      
      // In development, we might want to use the dev endpoint
      if (import.meta.env.DEV) {
        endpoint = '/api/dev/gift-products';
      }
      
      const response = await fetch(`${API_BASE}${endpoint}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response: not JSON');
      }
      
      const data = await response.json();
      console.log('Available products API response:', data);
      
      // The API might return the products directly or within a data property
      const productsData = data.data || data;
      
      // Validate products is an array
      if (Array.isArray(productsData)) {
        console.log(`Loaded ${productsData.length} products`);
        
        // Map products to ensure they have the required structure
        const validatedProducts = productsData.map(product => {
          // Ensure each product has the minimum required fields
          if (!product._id || !product.name) {
            console.warn('Product missing required fields:', product);
          }
          
          return {
            _id: product._id || '',
            name: product.name || 'Unnamed Product',
            price: typeof product.price === 'number' ? product.price : 0,
            images: Array.isArray(product.images) ? product.images : []
          };
        });
        
        setProducts(validatedProducts);
      } else {
        console.error('Invalid products format:', productsData);
        throw new Error('Invalid products format: not an array');
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast({
        title: 'Failed to load products',
        description: error.message || 'Please try refreshing the page',
        variant: 'destructive'
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate inputs before submitting
      if (!config.title.trim()) {
        throw new Error('Popup title is required');
      }
      
      // Ensure minCartValue is a valid number
      if (isNaN(config.minCartValue) || config.minCartValue < 0) {
        throw new Error('Minimum cart value must be a positive number');
      }
      
      // Ensure maxSelectableGifts is a valid number
      if (isNaN(config.maxSelectableGifts) || config.maxSelectableGifts < 1) {
        throw new Error('Maximum selectable gifts must be at least 1');
      }
      
      // Validate minimum selectable gifts doesn't exceed available products
      if (config.maxSelectableGifts > selectedProducts.length && selectedProducts.length > 0) {
        toast({
          title: 'Invalid configuration',
          description: `Maximum selectable gifts (${config.maxSelectableGifts}) cannot exceed the number of available gift products (${selectedProducts.length})`,
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }
      
      // Safely prepare the gift products array
      const giftProductIds = Array.isArray(selectedProducts) 
        ? selectedProducts.map(p => p._id).filter(Boolean)
        : [];
      
      // Create a cleaned config object with validated data
      const updatedConfig = {
        ...config,
        title: config.title.trim(),
        subTitle: config.subTitle.trim(),
        minCartValue: Number(config.minCartValue),
        maxCartValue: config.maxCartValue === null ? null : Number(config.maxCartValue),
        maxSelectableGifts: Number(config.maxSelectableGifts),
        giftProducts: giftProductIds
      };
      
      console.log('Saving gift popup configuration:', updatedConfig);
      
      // Try the authenticated endpoint first, fall back to dev endpoint in development
      let endpoint = '/api/admin/gift-popup';
      
      // In development, we might want to use the dev endpoint
      if (import.meta.env.DEV) {
        endpoint = '/api/dev/gift-popup';
      }
      
      const response = await put<{data: GiftPopupConfig; status: number; message?: string}>(`${API_BASE}${endpoint}`, updatedConfig);
      console.log('Gift popup save response:', response);
      
      // Check for API error responses
      if (response.status >= 400) {
        throw new Error(response.message || 'Error saving configuration');
      }
      
      // Ensure we have a valid response before updating state
      if (response.data && typeof response.data === 'object') {
        setConfig(response.data as GiftPopupConfig);
        
        toast({
          title: 'Gift popup configuration saved successfully',
          variant: 'default'
        });
        
        // Reload the configuration to ensure we have the latest data
        await loadConfig();
      } else {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error saving gift popup config:', error);
      toast({
        title: 'Failed to save configuration',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    try {
      // Check if the product is already selected
      const isSelected = selectedProducts.some(p => p._id === product._id);
      
      // Create a safe copy of the current gift products array
      const currentGiftProducts = Array.isArray(config.giftProducts) ? [...config.giftProducts] : [];
      
      // Toggle selection status with proper error handling
      const updatedGiftProducts = isSelected 
        ? currentGiftProducts.filter(id => id !== product._id)
        : [...currentGiftProducts, product._id];
      
      // Update config with the new gift products array
      setConfig({
        ...config,
        giftProducts: updatedGiftProducts
      });
      
      console.log(`Product ${isSelected ? 'removed from' : 'added to'} gift selection:`, product.name);
    } catch (error) {
      console.error('Error handling product selection:', error);
      toast({
        title: 'Error selecting product',
        description: 'There was a problem updating the product selection',
        variant: 'destructive'
      });
    }
  };

  const handleMaxSelectableChange = (value: string) => {
    const num = parseInt(value, 10);
    
    if (isNaN(num) || num < 1) {
      setConfig({ ...config, maxSelectableGifts: 1 });
    } else {
      setConfig({ ...config, maxSelectableGifts: num });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gift Popup Management</h2>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          Save Configuration
        </Button>
      </div>

      {loading ? (
        <div className="w-full flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle>Popup Settings</CardTitle>
              <CardDescription>Configure how your gift popup appears to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Popup Title</Label>
                <Input
                  id="title"
                  value={config.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig({ ...config, title: e.target.value })}
                />
              </div>
              
              {/* Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="subTitle">Popup Subtitle</Label>
                <Input
                  id="subTitle"
                  value={config.subTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig({ ...config, subTitle: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">Example: "Choose Any 2"</p>
              </div>
              
              {/* Min Cart Value */}
              <div className="space-y-2">
                <Label htmlFor="minCartValue">Minimum Cart Value (₹)</Label>
                <Input
                  id="minCartValue"
                  type="number"
                  value={config.minCartValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig({ ...config, minCartValue: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">Popup will appear when cart value is at least this amount</p>
              </div>
              
              {/* Max Cart Value */}
              <div className="space-y-2">
                <Label htmlFor="maxCartValue">Maximum Cart Value (₹) <span className="text-sm text-muted-foreground">(Optional)</span></Label>
                <Input
                  id="maxCartValue"
                  type="number"
                  value={config.maxCartValue === null ? '' : config.maxCartValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value.trim() === '' ? null : parseFloat(e.target.value);
                    setConfig({ ...config, maxCartValue: value });
                  }}
                  placeholder="No upper limit"
                />
                <p className="text-sm text-muted-foreground">Popup will not appear if cart value exceeds this amount</p>
              </div>
              
              {/* Max Selectable Gifts */}
              <div className="space-y-2">
                <Label htmlFor="maxSelectableGifts">Maximum Selectable Gifts</Label>
                <Input
                  id="maxSelectableGifts"
                  type="number"
                  min="1"
                  value={config.maxSelectableGifts}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleMaxSelectableChange(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Number of gifts customer can select</p>
              </div>
              
              {/* Active Status */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <Label htmlFor="active" className="text-base">Popup Active</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable gift popup</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={config.active}
                    onCheckedChange={(checked) => setConfig({ ...config, active: checked })}
                  />
                  <span className={config.active ? 'text-green-600' : 'text-red-600'}>
                    {config.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gift Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Gift Products</CardTitle>
              <CardDescription>Select products to offer as gifts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4">
                <ProductSelector
                  products={products}
                  selectedProducts={selectedProducts}
                  onProductSelect={handleProductSelect}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Selected Gift Products ({selectedProducts.length})</Label>
                <div className="border rounded-md p-3 min-h-[100px] max-h-[300px] overflow-y-auto">
                  {selectedProducts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">No gift products selected</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProducts.map(product => (
                        <div key={product._id} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProductSelect(product)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-semibold">Preview Settings</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Appears when cart value is: {formatCurrency(config.minCartValue)} 
                    {config.maxCartValue !== null ? ` - ${formatCurrency(config.maxCartValue)}` : ' or more'}
                  </p>
                  <p>Customer can select: <Badge variant="outline">{config.maxSelectableGifts} gift{config.maxSelectableGifts !== 1 ? 's' : ''}</Badge></p>
                  <p>Popup status: <Badge variant={config.active ? "default" : "secondary"}>{config.active ? 'Active' : 'Inactive'}</Badge></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
