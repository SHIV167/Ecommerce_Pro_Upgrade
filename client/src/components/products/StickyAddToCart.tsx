import { useEffect } from 'react';
import AnimatedCartButton from '@/components/ui/AnimatedCartButton';

interface StickyAddToCartProps {
  product: any;
  quantity: number;
  setQuantity: (q: number) => void;
  onAddToCart: () => void;
}

// Function to handle mobile visibility
const setupMobileVisibility = () => {
  const mobileContainer = document.getElementById('mobile-add-to-cart-container');
  if (!mobileContainer) return;

  const checkScreenSize = () => {
    if (window.innerWidth < 768) { // Show only on mobile (under 768px)
      mobileContainer.style.display = 'flex';
      mobileContainer.style.justifyContent = 'center';
      mobileContainer.style.alignItems = 'center';
    } else {
      mobileContainer.style.display = 'none';
    }
  };

  // Initial check
  checkScreenSize();

  // Add event listener for window resize
  window.addEventListener('resize', checkScreenSize);

  // Cleanup function
  return () => window.removeEventListener('resize', checkScreenSize);
};

export default function StickyAddToCart({ product, quantity, setQuantity, onAddToCart }: StickyAddToCartProps) {
  // Set up mobile visibility on component mount
  useEffect(() => {
    const cleanup = setupMobileVisibility();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);
  // Show only if product is loaded
  if (!product) return null;

  return (
    <>
      {/* Mobile sticky Add to Cart button - only shown on mobile */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
        style={{
          display: 'none', // Hide by default
          padding: '8px',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
        id="mobile-add-to-cart-container"
      >
        {product.stock === 0 ? (
          <AnimatedCartButton disabled className="flex-1 min-w-0 w-full max-w-full h-11 bg-gray-500 text-white font-semibold text-sm tracking-wide rounded-md shadow-lg cursor-not-allowed">
            Out of Stock
          </AnimatedCartButton>
        ) : (
          <AnimatedCartButton
            onClick={onAddToCart}
            className="flex-1 min-w-0 w-full max-w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm tracking-wide rounded-md shadow-lg"
            variant="primary"
          >
            Add to Cart • ₹{product.price}
          </AnimatedCartButton>
        )}
      </div>
      
      {/* Desktop version - only shown on desktop */}
      <div className="fixed bottom-0 left-0 right-0 hidden md:flex bg-white shadow-2xl border border-neutral-sand rounded-t-xl items-center gap-4 px-6 py-4 w-full max-w-2xl mx-auto" style={{ zIndex: 999 }}>
        <img
          src={product.images?.[0] || product.imageUrl}
          alt={product.name}
          className="w-14 h-14 rounded object-cover border"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate text-base text-primary">{product.name}</div>
          <div className="text-base font-bold text-green-700 md:text-lg">₹{product.price}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-bold text-primary border hover:bg-neutral-200"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label="Decrease quantity"
            type="button"
          >-</button>
          <span className="w-8 text-center font-semibold">{quantity}</span>
          <button
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-bold text-primary border hover:bg-neutral-200"
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            aria-label="Increase quantity"
            type="button"
          >+</button>
        </div>
        {product.stock === 0 ? (
          <AnimatedCartButton disabled className="h-12 ml-4 px-8 bg-gray-500 text-white font-bold rounded-md cursor-not-allowed">
            Out of Stock
          </AnimatedCartButton>
        ) : (
          <AnimatedCartButton
            className="h-12 ml-4 px-8 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-md"
            onClick={onAddToCart}
            variant="primary"
          >
            Add to Cart
          </AnimatedCartButton>
        )}
      </div>
    </>
  );
}
