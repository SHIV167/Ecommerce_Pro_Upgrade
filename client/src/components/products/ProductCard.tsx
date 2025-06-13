import { Link } from "wouter";
import { Product } from "@shared/schema";
import RatingStars from "./RatingStars";
import PromoTimerBadge from "./PromoTimerBadge";
import { useCart } from "@/hooks/useCart";
import AnimatedCartButton from "@/components/ui/AnimatedCartButton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import VideoModal from "@/components/common/VideoModal";

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export default function ProductCard({ product, showAddToCart = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const handleAddToCart = async () => {
    try {
      await addItem(product);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to add ${product.name} to cart. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const [showVideo, setShowVideo] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Wishlist state and handlers
  const [inWishlist, setInWishlist] = useState(false);
  useEffect(() => {
    if (isAuthenticated && user) {
      axios
        .get(`/api/users/${user.id}/wishlist`)
        .then(res => {
          const ids = (res.data as any[]).map(p => p._id || p.id);
          if (ids.includes(product._id)) setInWishlist(true);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user, product._id]);
  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast({ title: 'Please login to use wishlist', variant: 'destructive' });
      return;
    }
    try {
      if (!inWishlist) {
        await axios.post(`/api/users/${user.id}/wishlist`, { productId: product._id });
        setInWishlist(true);
        toast({ title: 'Added to wishlist' });
      } else {
        await axios.delete(`/api/users/${user.id}/wishlist/${product._id}`);
        setInWishlist(false);
        toast({ title: 'Removed from wishlist' });
      }
    } catch {
      toast({ title: 'Wishlist update failed', variant: 'destructive' });
    }
  };

  // Helper to check if a URL is YouTube
  const isYouTubeUrl = (url?: string) => url && /youtu(be)?\.([a-z]+)/i.test(url);

  // Calculate discount percentage if discounted price exists
  const calculateDiscountPercentage = () => {
    if (!product.discountedPrice) return null;
    const discount = product.price - product.discountedPrice;
    const percentage = Math.round((discount / product.price) * 100);
    return percentage > 0 ? percentage : null;
  };

  const discountPercentage = calculateDiscountPercentage();

  // Find promo timer for this product
  const promoTimers = (window as any).PROMO_TIMERS as { productId: string; endTime: string; enabled: boolean }[] | undefined;
  const promoTimer = promoTimers?.find(t => t.enabled && (t.productId === product._id || t.productId === product.slug));

  return (
    <div 
      className="product-card bg-white border border-neutral-sand hover:shadow-lg transition-all duration-300 flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative pt-6 px-6 flex flex-col items-center">
        {/* Promo Timer Badge */}
        {promoTimer && <PromoTimerBadge endTime={promoTimer.endTime} />}
        {/* Badge */}
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-[#A72B1D] text-white text-xs px-2 py-1 uppercase tracking-wider z-10 rounded">
            New
          </span>
        )}
        {!product.isNew && product.featured && (
          <span className="absolute top-2 left-2 bg-neutral-darkGray text-white text-xs px-2 py-1 uppercase tracking-wider z-10 rounded">
            Featured
          </span>
        )}
        {/* Wishlist Heart */}
        <button
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-neutral-cream transition-colors"
          aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          onClick={toggleWishlist}
        >
          {inWishlist ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3.172 5.172a4 4 0 018.056 0L10 6.293l-1.228-1.121a4 4 0 10-5.6 5.6L10 18l6.228-6.228a4 4 0 00-5.6-5.6L10 6.293 11.056 5.172a4 4 0 10-7.884 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-gray hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
            </svg>
          )}
        </button>
        {/* Video Icon - show only if videoUrl exists */}
        {product.videoUrl && (
          <button
            className="absolute top-2 right-12 bg-white rounded-full border-2 border-green-500 p-1 z-20 shadow"
            style={{ boxShadow: '0 2px 8px rgba(0,128,0,0.12)' }}
            aria-label="Play Product Video"
            onClick={e => { e.preventDefault(); setShowVideo(true); }}
          >
            {/* Play Icon SVG */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="10" stroke="#22c55e" strokeWidth="2" fill="white" />
              <polygon points="9,7 16,11 9,15" fill="#22c55e" />
            </svg>
          </button>
        )}
        {/* Product Image */}
        <Link href={`/products/${product.slug}.html`} className="block w-full mb-4">
          <div className="relative w-full aspect-square">
            <img 
              src={(() => {
                // Get main image
                const mainImage = product.images?.[0] || product.imageUrl;
                if (!mainImage) return '/uploads/products/placeholder.jpg';
                
                // If it's a Cloudinary URL, use it directly
                if (mainImage.includes('cloudinary.com')) {
                  // Ensure HTTPS
                  return mainImage.startsWith('http://') ? mainImage.replace('http://', 'https://') : mainImage;
                }
                
                // Clean up double uploads if present
                const cleanMainImage = mainImage.replace('/uploads/products//uploads/', '/uploads/products/');
                
                // If it's already a correct uploads path, use it
                if (cleanMainImage.startsWith('/uploads/products/')) return cleanMainImage;
                
                // For any URL (local or external), extract just the filename
                if (cleanMainImage.includes('/')) {
                  const filename = cleanMainImage.split('/').pop();
                  return `/uploads/products/${filename}`;
                }
                
                // For just filename, add the uploads path
                return `/uploads/products/${cleanMainImage}`;
              })()} 
              alt={product.name} 
              className={`w-full h-full object-contain absolute top-0 left-0 transition-opacity duration-300 ${isHovered && product.images?.[0] ? 'opacity-0' : 'opacity-100'}`}
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null; // Prevent infinite fallback loop
                img.src = '/uploads/products/placeholder.jpg';
              }}
            />
            {/* Show second image on hover if available */}
            {product.images?.length > 1 && (
              <img 
                src={(() => {
                  // Get hover image (second image if available, otherwise first)
                  const hoverImage = product.images?.length > 1 ? product.images[1] : product.images?.[0];
                  if (!hoverImage) return '/uploads/products/placeholder.jpg';
                  
                  // If it's a Cloudinary URL, use it directly
                  if (hoverImage.includes('cloudinary.com')) {
                    // Ensure HTTPS
                    return hoverImage.startsWith('http://') ? hoverImage.replace('http://', 'https://') : hoverImage;
                  }
                  
                  // Clean up double uploads if present
                  const cleanHoverImage = hoverImage.replace('/uploads/products//uploads/', '/uploads/products/');
                  
                  // If it's already a correct uploads path, use it
                  if (cleanHoverImage.startsWith('/uploads/products/')) return cleanHoverImage;
                  
                  // For any URL (local or external), extract just the filename
                  if (cleanHoverImage.includes('/')) {
                    const filename = cleanHoverImage.split('/').pop();
                    return `/uploads/products/${filename}`;
                  }
                  
                  // For just filename, add the uploads path
                  return `/uploads/products/${cleanHoverImage}`;
                })()} 
                alt={`${product.name} - alternate view`} 
                className={`w-full h-full object-contain absolute top-0 left-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.onerror = null; // Prevent infinite fallback loop
                  img.src = '/uploads/products/placeholder.jpg';
                }}
              />
            )}
          </div>
        </Link>
      </div>
      <div className="flex flex-col flex-1 px-6 pb-6">
        {/* Rating */}
        <div className="mb-2 flex items-center justify-center">
          <RatingStars rating={product.rating} reviews={product.totalReviews} />
        </div>
        {/* Product Name */}
        <h3 className="font-heading text-primary hover:text-primary-light mb-1 text-base text-center line-clamp-2 min-h-[3rem]">
          <Link href={`/products/${product.slug}.html`}>{product.name}</Link>
        </h3>
        {/* Short Description */}
        <div className="min-h-[3rem] mb-3">
          {product.shortDescription ? (
            <p className="text-sm text-neutral-gray text-center line-clamp-2">{product.shortDescription}</p>
          ) : <div className="h-full"></div>}
        </div>
        {/* Price */}
        <div className="flex items-center justify-center gap-2 mb-4 min-h-[2rem]">
          {product.discountedPrice ? (
            <>
              <span className="font-semibold text-lg text-primary">{formatCurrency(product.discountedPrice)}</span>
              <span className="text-sm text-neutral-gray line-through">{formatCurrency(product.price)}</span>
              {discountPercentage && (
                <span className="ml-2 inline-flex items-center bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-sm">
                  -{discountPercentage}%
                </span>
              )}
            </>
          ) : (
            <span className="font-semibold text-lg text-primary">{formatCurrency(product.price)}</span>
          )}
        </div>
        {/* Add to Bag Button */}
        {product.stock === 0 ? (
          <AnimatedCartButton disabled className="w-full bg-gray-500 text-white uppercase tracking-wide font-medium mt-auto cursor-not-allowed">
            Out of Stock
          </AnimatedCartButton>
        ) : (
          <AnimatedCartButton
            className="w-full bg-black hover:bg-neutral-darkGray text-white uppercase tracking-wide font-medium mt-auto"
            onClick={handleAddToCart}
          >
            Add to Bag
          </AnimatedCartButton>
        )}
      </div>
      <VideoModal open={showVideo && !!product.videoUrl} onClose={() => setShowVideo(false)}>
        <div className="w-full aspect-video bg-black flex items-center justify-center">
          {product.videoUrl && isYouTubeUrl(product.videoUrl) ? (
            <iframe
              className="w-full h-full rounded-b-xl"
              src={product.videoUrl.replace("watch?v=", "embed/")}
              title="Product Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : product.videoUrl ? (
            <video src={product.videoUrl} controls className="w-full h-full rounded-b-xl" />
          ) : null}
        </div>
      </VideoModal>
    </div>
  );
}
