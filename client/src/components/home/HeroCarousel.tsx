import { useState, useEffect } from "react";
import AnimatedCartButton from "@/components/ui/AnimatedCartButton";
import BannerLoader from "@/components/ui/BannerLoader";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Banner } from "@shared/schema";

// Helper function for Cloudinary URL optimization
const optimizeCloudinaryUrl = (url: string, options: { width?: number, quality?: number, format?: string } = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Ensure HTTPS
  let optimizedUrl = url.replace('http://', 'https://');
  
  // Check if URL already has transformation parameters
  if (optimizedUrl.includes('/upload/')) {
    // Insert transformation parameters after /upload/
    const transformationString = `w_${options.width || 'auto'},q_${options.quality || 80},f_${options.format || 'auto'}`;
    optimizedUrl = optimizedUrl.replace('/upload/', `/upload/${transformationString}/`);
  }
  
  return optimizedUrl;
};

export default function HeroCarousel() {
  // Fetch banners from backend
  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await fetch('/api/banners?enabled=true');
      if (!res.ok) throw new Error('Failed to fetch banners');
      const data = await res.json();
      // Sort by position if not already sorted by backend
      return data.sort((a: Banner, b: Banner) => (a.position ?? 0) - (b.position ?? 0));
    }
  });
  // Carousel index state
  const [current, setCurrent] = useState(0);

  // Define goPrev/goNext before useEffect to avoid initialization error
  const goPrev = () => setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const goNext = () => setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  // Auto-slide every 5s
  useEffect(() => {
    const timer = setInterval(() => goNext(), 5000);
    return () => clearInterval(timer);
  }, [banners]);

  if (isLoading || banners.length === 0) {
    return <BannerLoader />;
  }

  return (
    <div className="relative w-full border border-neutral-sand overflow-hidden bg-[#f8f4ea] md:top-0 -top-16">
      <div className="flex w-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {banners.map((banner, idx) => {
          const content = (
            <picture key={idx} className="w-full flex-shrink-0">
              <source 
                media="(max-width: 767px)" 
                srcSet={(() => {
                  const imageUrl = banner.mobileImageUrl;
                  if (!imageUrl) return '/uploads/banners/placeholder.jpg';
                  
                  // Optimize Cloudinary URL with mobile-specific parameters
                  if (imageUrl.includes('cloudinary.com')) {
                    return `${optimizeCloudinaryUrl(imageUrl, { width: 768, quality: 80, format: 'auto' })} 1x`;
                  }
                  
                  // For local uploads, add descriptor
                  return `${imageUrl} 1x`;
                })()} 
                onError={(e) => {
                  const source = e.target as HTMLSourceElement;
                  source.onerror = null;
                  source.srcset = '/uploads/banners/placeholder.jpg 1x';
                }}
              />
              <img
                src={(() => {
                  // Get desktop image URL
                  const imageUrl = banner.desktopImageUrl;
                  if (!imageUrl) return '/uploads/banners/placeholder.jpg';
                  
                  // Optimize Cloudinary URL with desktop-specific parameters
                  if (imageUrl.includes('cloudinary.com')) {
                    return optimizeCloudinaryUrl(imageUrl, { width: 1920, quality: 85, format: 'auto' });
                  }
                  
                  return imageUrl;
                })()}
                alt={banner.alt}
                className="w-full h-auto object-cover"
                style={{ maxHeight: '100%' }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.onerror = null;
                  img.src = '/uploads/banners/placeholder.jpg';
                }}
              />
            </picture>
          );
          return banner.linkUrl ? (
            <a
              key={idx}
              href={banner.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex-shrink-0 block"
            >
              {content}
            </a>
          ) : content;
        })}
      </div>
      {/* Slider Controls */}
      <button
        aria-label="Previous banner"
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full p-2 shadow transition pointer-events-auto z-20"
      >
        <span className="sr-only">Previous</span>
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button
        aria-label="Next banner"
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white/90 rounded-full p-2 shadow transition pointer-events-auto z-20"
      >
        <span className="sr-only">Next</span>
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
      </button>
      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto z-20">
        {banners.map((_, idx) => (
          <span
            key={idx}
            className={`w-2 h-2 rounded-full ${current === idx ? 'bg-[#A72B1D]' : 'bg-neutral-300'} inline-block transition-all`}
          />
        ))}
      </div>
    </div>
  );
}