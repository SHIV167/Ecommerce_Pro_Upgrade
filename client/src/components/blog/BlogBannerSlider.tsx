import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Static banner data specifically for blog page
const blogBanners = [
  {
    id: 1,
    desktopImageUrl: "/uploads/banners/blog-banner1.jpg",
    mobileImageUrl: "/uploads/banners/blog-banner1-mobile.jpg",
    alt: "Ayurvedic Skin Care Blog",
    linkUrl: "/blogs/category/skincare"
  },
  {
    id: 2,
    desktopImageUrl: "/uploads/banners/blog-banner2.jpg",
    mobileImageUrl: "/uploads/banners/blog-banner2-mobile.jpg",
    alt: "Hair Care Wisdom",
    linkUrl: "/blogs/category/haircare"
  },
  {
    id: 3,
    desktopImageUrl: "/uploads/banners/blog-banner3.jpg",
    mobileImageUrl: "/uploads/banners/blog-banner3-mobile.jpg",
    alt: "Wellness Tips & Tricks",
    linkUrl: "/blogs/category/wellness"
  }
];

// Helper function to ensure banners are available (use fallbacks from home page if needed)
const ensureBannerImages = () => {
  return blogBanners.map(banner => ({
    ...banner,
    desktopImageUrl: banner.desktopImageUrl || "/uploads/banners/placeholder.jpg",
    mobileImageUrl: banner.mobileImageUrl || "/uploads/banners/placeholder.jpg"
  }));
};

export default function BlogBannerSlider() {
  const banners = ensureBannerImages();
  
  // Carousel index state
  const [current, setCurrent] = useState(0);

  // Navigation functions
  const goPrev = () => setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const goNext = () => setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  // Auto-slide every 5s
  useEffect(() => {
    const timer = setInterval(() => goNext(), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-[#f8f4ea]">
      <div className="flex w-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {banners.map((banner, idx) => {
          const content = (
            <picture key={idx} className="w-full flex-shrink-0">
              <source 
                media="(max-width: 767px)" 
                srcSet={banner.mobileImageUrl}
                onError={(e) => {
                  const source = e.target as HTMLSourceElement;
                  source.onerror = null;
                  source.srcset = '/uploads/banners/placeholder.jpg';
                }}
              />
              <img
                src={banner.desktopImageUrl}
                alt={banner.alt}
                className="w-full h-auto object-cover"
                style={{ maxHeight: '450px' }}
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
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              current === idx ? "bg-[#A72B1D]" : "bg-white/60 hover:bg-white/90"
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
