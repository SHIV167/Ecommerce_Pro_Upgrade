import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Search } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
}

interface ProductSelectorProps {
  products: Product[];
  selectedProducts: Product[];
  onProductSelect: (product: Product) => void;
}

export default function ProductSelector({ 
  products, 
  selectedProducts, 
  onProductSelect 
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSelected, setShowSelected] = useState(false);

  // Filter products based on search term and selected status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isSelected = selectedProducts.some(p => p._id === product._id);
    
    if (showSelected) {
      return isSelected && matchesSearch;
    } else {
      return matchesSearch;
    }
  });

  // Check if products are loading or empty
  const isProductsEmpty = products.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            disabled={isProductsEmpty}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSelected(!showSelected)}
          className="whitespace-nowrap"
          disabled={isProductsEmpty || selectedProducts.length === 0}
        >
          {showSelected ? 'Show All Products' : 'Show Selected Only'}
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <div className="max-h-[300px] overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <p className="text-center p-4 text-muted-foreground">
              {searchTerm ? 'No products match your search' : 'No products available'}
            </p>
          ) : (
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const isSelected = selectedProducts.some(p => p._id === product._id);
                  return (
                    <tr 
                      key={product._id} 
                      className={`border-t ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-2">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {product._id}</div>
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          variant={isSelected ? "destructive" : "default"}
                          size="sm"
                          onClick={() => onProductSelect(product)}
                        >
                          {isSelected ? 'Remove' : 'Add'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
