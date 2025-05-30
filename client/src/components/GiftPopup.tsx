import React, { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface GiftProduct {
  _id: string;
  name: string;
  price: number;
  images: string[];
  description?: string;
  // Additional fields from Product type that might be present
  sku?: string;
  slug?: string;
  categoryId?: string;
  imageUrl?: string;
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

export default function GiftPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<GiftPopupConfig | null>(null);
  const [giftProducts, setGiftProducts] = useState<GiftProduct[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart, cartItems, addGiftToCart, removeItemFromCart } = useCart();
  const [dismissedUntilCartChange, setDismissedUntilCartChange] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate products per page and total pages
  const productsPerPage = isMobile ? 1 : 2;
  const totalPages = Math.ceil((giftProducts.length || 0) / productsPerPage);
  
  // Get current page products
  const getCurrentPageProducts = () => {
    const startIndex = currentPage * productsPerPage;
    return giftProducts.slice(startIndex, startIndex + productsPerPage);
  };

  // Load gift popup configuration and products
  useEffect(() => {
    const fetchGiftConfig = async () => {
      try {
        const response = await fetch('/api/gift-popup');
        if (!response.ok) throw new Error('Failed to fetch gift popup config');
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('Error fetching gift popup config:', error);
      }
    };

    const fetchGiftProducts = async () => {
      try {
        const response = await fetch('/api/gift-products');
        if (!response.ok) throw new Error('Failed to fetch gift products');
        const data = await response.json();
        setGiftProducts(data);
      } catch (error) {
        console.error('Error fetching gift products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGiftConfig();
    fetchGiftProducts();
  }, []);

  // Reset dismissal and selection when cart changes
  useEffect(() => {
    setDismissedUntilCartChange(false);
    setSelectedGifts([]);
  }, [cart.id]);

  // Auto-remove all gift items when cart out of eligible range and control popup
  useEffect(() => {
    if (!config?.active || loading) return;
    const cartTotal = cart.totalPrice;
    const isCartEligible =
      cartTotal >= config.minCartValue &&
      (config.maxCartValue === null || cartTotal <= config.maxCartValue);

    // Remove all gift items from cart if not eligible
    if (!isCartEligible) {
      cartItems.filter(item => item.isGift).forEach(item => {
        const pid = (item.product as any)._id || (item.product as any).id;
        removeItemFromCart(pid);
      });
      setSelectedGifts([]);
    }

    // Show or hide popup
    setIsOpen(isCartEligible && !dismissedUntilCartChange && giftProducts.length > 0);
  }, [cart.totalPrice, config?.active, loading, giftProducts.length, cartItems, dismissedUntilCartChange, removeItemFromCart]);

  // Handle selecting a gift
  const handleSelectGift = (productId: string) => {
    // Enforce max selectable gifts
    if (!config) return;
    if (!selectedGifts.includes(productId) && selectedGifts.length >= (config.maxSelectableGifts || 2)) return;
    setSelectedGifts(prev => {
      // If already selected, remove it
      if (prev.includes(productId)) {
        removeItemFromCart(productId);
        return prev.filter(id => id !== productId);
      }
      
      // Otherwise, add it
      const product = giftProducts.find(p => p._id === productId);
      if (product) {
        addGiftToCart({
          _id: product._id,
          sku: `gift-${product._id}`,
          name: product.name,
          description: product.description || product.name,
          price: 0, // Free gift
          categoryId: product.categoryId || 'gifts',
          images: product.images || [],
          imageUrl: product.imageUrl || (product.images && product.images[0]) || '',
          slug: product.slug || `gift-${product._id}`,
          stock: 1,
          faqs: [],
          customSections: [],
          structuredIngredients: [],
          structuredBenefits: [],
          howToUse: '',
          shortDescription: 'Complimentary gift',
          isGift: true
        } as any);
        return [...prev, productId];
      }
      return prev;
    });
  };

  // Handle closing the popup
  const handleClose = () => {
    setDismissedUntilCartChange(true);
  };

  // Handle pagination
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  if (!isOpen || !config || loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-3">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-auto overflow-hidden flex flex-col" 
           style={{ maxHeight: '85vh' }}>
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X size={18} />
        </button>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-100 to-amber-200 p-4 text-center border-b">
          <h2 className="text-xl font-bold text-amber-900">{config.title}</h2>
          <p className="text-sm text-amber-800 font-medium">{config.subTitle}</p>
        </div>
        
        {/* Gift Products Grid */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 150px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getCurrentPageProducts().map((product) => {
              const isSelected = selectedGifts.includes(product._id);
              return (
                <div 
                  key={product._id}
                  className={`border rounded-lg overflow-hidden transition-all h-[240px] flex flex-col ${
                    isSelected 
                      ? 'border-amber-500 ring-2 ring-amber-300 shadow-md' 
                      : 'border-gray-200 hover:border-amber-200'
                  }`}
                >
                  <div className="h-[120px] bg-gray-50 flex items-center justify-center p-2">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full max-h-full w-auto max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-medium text-gray-900 truncate text-sm">{product.name}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-green-600 font-medium text-sm">Free</span>
                      <span className="text-gray-500 line-through text-xs">₹{product.price.toFixed(0)}</span>
                    </div>
                    
                    <button
                      onClick={() => handleSelectGift(product._id)}
                      className={`mt-auto w-full py-2 px-3 rounded-md transition-colors text-sm font-medium flex items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : selectedGifts.length >= (config?.maxSelectableGifts || 2)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      disabled={!isSelected && selectedGifts.length >= (config?.maxSelectableGifts || 2)}
                    >
                      {isSelected ? (
                        <>
                          <Check size={16} className="mr-1" />
                          <span>Selected</span>
                        </>
                      ) : (
                        'Select Gift'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Navigation Controls */}
        <div className="flex justify-between px-4 pt-2">
          <button 
            className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center text-xs text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </div>
          <button 
            className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 mt-auto">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div>
              <span className="text-gray-600 text-sm">
                {selectedGifts.length} of {config.maxSelectableGifts} gifts selected
              </span>
            </div>
            <button
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors text-sm font-medium"
            >
              {selectedGifts.length > 0 ? 'Continue with Selected Gifts' : 'Skip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
