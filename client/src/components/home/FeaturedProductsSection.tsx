import React, { useRef, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { Link } from "wouter";
import { CartContext } from "@/contexts/CartContext";
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

// Extended Product type with our custom fields for UI display
interface ProductDisplay extends Omit<Product, 'customSections'> {
  // Add any additional fields needed for display
  rating?: number;
  reviewCount?: number;
  // Ensure customSections matches the expected type
  customSections: Array<{
    id: string;
    title: string;
    htmlContent: string;
    displayOrder: number;
    enabled: boolean;
  }>;
}

// Sample fallback products
const sampleProducts: ProductDisplay[] = [
  {
    _id: "1",
    sku: "THYRO001",
    name: "Thyrobik Capsule - Ayurvedic Thyroid Capsule",
    description: "Ayurvedic thyroid support capsule",
    shortDescription: "Natural thyroid support",
    price: 1990,
    discountedPrice: null,
    imageUrl: "/images/products/thyrobik.jpg",
    stock: 10,
    rating: 4.8,
    totalReviews: 12,
    slug: "thyrobik-capsule",
    categoryId: "thyroid",
    featured: true,
    bestseller: false,
    isNew: true,
    images: ["/images/products/thyrobik.jpg"],
    faqs: [],
    customSections: [],
    ingredients: "Natural herbs and extracts",
    structuredIngredients: [],
    benefits: "Supports healthy thyroid function",
    structuredBenefits: [],
    minOrderValue: 0,
    isFreeProduct: false,
    usageFrequency: "Twice daily",
    customHtmlSections: []
  },
  {
    _id: "2",
    sku: "WEIGHT001",
    name: "Sheepala Curtail - Best Weight Loss Capsules",
    description: "Ayurvedic weight management capsule",
    shortDescription: "Natural weight management",
    price: 1499,
    discountedPrice: 1299,
    imageUrl: "/images/products/curtail.jpg",
    stock: 15,
    rating: 4.6,
    totalReviews: 24,
    slug: "sheepala-curtail",
    categoryId: "weight-loss",
    featured: true,
    bestseller: true,
    isNew: false,
    images: ["/images/products/curtail.jpg"],
    faqs: [],
    customSections: [],
    ingredients: "Natural herbs for weight management",
    structuredIngredients: [],
    benefits: "Supports healthy weight management",
    structuredBenefits: [],
    minOrderValue: 0,
    isFreeProduct: false,
    usageFrequency: "Once daily",
    customHtmlSections: []
  },
  {
    _id: "3",
    sku: "DIAB001",
    name: "Diabtose+ - Ayurvedic Diabetes Management",
    description: "Ayurvedic diabetes management supplement",
    shortDescription: "Blood sugar support",
    price: 1699,
    discountedPrice: null,
    imageUrl: "/images/products/diabtose.jpg",
    stock: 8,
    rating: 4.7,
    totalReviews: 15,
    slug: "diabtose-plus",
    categoryId: "diabetes",
    featured: false,
    bestseller: false,
    isNew: true,
    images: ["/images/products/diabtose.jpg"],
    faqs: [],
    customSections: [],
    ingredients: "Herbs for blood sugar support",
    structuredIngredients: [],
    benefits: "Supports healthy blood sugar levels",
    structuredBenefits: [],
    minOrderValue: 0,
    isFreeProduct: false,
    usageFrequency: "Twice daily",
    customHtmlSections: []
  }
];

export default function FeaturedProductsSection() {
  const sliderRef = useRef<Slider>(null);
  const { addItem } = useContext(CartContext);
  const { data: products = [], isLoading } = useQuery<ProductDisplay[]>({
    queryKey: ['/api/products/featured?limit=4'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/products/featured?limit=4');
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error fetching featured products:", error);
        return [];
      }
    },
  });

  // Map products to ensure they match the expected Product type and add missing customHtmlSections
  const displayProducts = (products.length > 0 ? products : sampleProducts).map(product => {
    // Add customHtmlSections if missing
    if (!product.customHtmlSections) {
      product = { ...product, customHtmlSections: [] };
    }
    // Create a base product with all required fields
    const baseProduct = {
      _id: product._id || '',
      sku: product.sku || `SKU-${product._id || '000'}`,
      name: product.name || 'Unnamed Product',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: product.price || 0,
      discountedPrice: product.discountedPrice || null,
      imageUrl: product.imageUrl || '/images/placeholder-product.jpg',
      stock: product.stock || 0,
      rating: product.rating || 0,
      totalReviews: product.totalReviews || 0,
      slug: product.slug || `product-${product._id || 'unknown'}`.toLowerCase().replace(/\s+/g, '-'),
      categoryId: product.categoryId || 'uncategorized',
      featured: product.featured || false,
      bestseller: product.bestseller || false,
      isNew: product.isNew || false,
      images: product.images || [product.imageUrl || '/images/placeholder-product.jpg'],
      videoUrl: product.videoUrl || '',
      faqs: product.faqs || [],
      customSections: (product.customSections || []).map(section => ({
        id: section.id || Math.random().toString(36).substr(2, 9),
        title: section.title || '',
        htmlContent: section.htmlContent || '',
        displayOrder: section.displayOrder || 0,
        enabled: section.enabled !== false
      })),
      ingredients: product.ingredients || '',
      structuredIngredients: product.structuredIngredients || [],
      howToUse: product.howToUse || '',
      howToUseVideo: product.howToUseVideo || '',
      howToUseSteps: product.howToUseSteps || [],
      benefits: product.benefits || '',
      structuredBenefits: product.structuredBenefits || [],
      minOrderValue: product.minOrderValue || 0,
      isFreeProduct: product.isFreeProduct || false,
      usageFrequency: product.usageFrequency || ''
    };

    // Add our custom fields for display
    return {
      ...baseProduct,
      // Add our custom fields
      reviewCount: (product as any).reviewCount || 0,
      customHtmlSections: product.customHtmlSections || []
    };
  });

  // Custom arrow components for the slider
  const SliderArrow = ({ className, style, onClick, isNext = false }: any) => {
    return (
      <button
        onClick={onClick}
        className={`custom-nav-arrow absolute z-20 top-1/2 transform -translate-y-1/2 ${isNext ? 'right-4' : 'left-4'} rounded-full w-12 h-12 flex items-center justify-center focus:outline-none ${className}`}
        style={{
          backgroundColor: 'rgba(85, 128, 118, 0.85)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s ease',
        }}
        aria-label={isNext ? 'Next slide' : 'Previous slide'}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(85, 128, 118, 1)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(85, 128, 118, 0.85)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        {isNext ? (
          <ChevronRight className="h-6 w-6 text-white" />
        ) : (
          <ChevronLeft className="h-6 w-6 text-white" />
        )}
      </button>
    );
  };

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    nextArrow: <SliderArrow isNext={true} />,
    prevArrow: <SliderArrow />,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ],
    customPaging: () => (
      <div className="h-2 w-2 rounded-full bg-neutral-300 hover:bg-primary mt-4"></div>
    ),
  };

  return (
    <section className="py-12 bg-white featured-products-section">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-2xl text-primary text-center mb-8">Featured Ayurvedic Products</h2>
        
        <div className="flex flex-col md:flex-row gap-6">          
          {/* Left side - Product slider (2/3 width on desktop) */}
          <div className="w-full md:w-2/3 relative">
            {/* Custom navigation buttons */}
            <button 
              onClick={() => sliderRef.current?.slickPrev()}
              className="custom-nav-arrow absolute z-20 top-1/2 transform -translate-y-1/2 left-4 rounded-full w-12 h-12 flex items-center justify-center focus:outline-none"
              style={{
                backgroundColor: 'rgba(85, 128, 118, 0.85)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
              aria-label="Previous slide"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(85, 128, 118, 1)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(85, 128, 118, 0.85)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            
            <button 
              onClick={() => sliderRef.current?.slickNext()}
              className="custom-nav-arrow absolute z-20 top-1/2 transform -translate-y-1/2 right-4 rounded-full w-12 h-12 flex items-center justify-center focus:outline-none"
              style={{
                backgroundColor: 'rgba(85, 128, 118, 0.85)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
              aria-label="Next slide"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(85, 128, 118, 1)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(85, 128, 118, 0.85)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
            {isLoading ? (
              // Skeleton loading state
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <Skeleton className="w-full h-64 rounded-lg" />
                    <Skeleton className="h-4 w-3/4 mt-3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 relative">
                <Slider ref={sliderRef} {...sliderSettings}>
                  {displayProducts.map((product) => (
                    <div key={product._id} className="px-2">
                      <ProductCard product={product} showAddToCart={true} />
                    </div>
                  ))}
                </Slider>
              </div>
            )}
          </div>
          
          {/* Right side - Banner with Hotspots (1/3 width on desktop) */}
          <div className="w-full md:w-1/3 mt-6 md:mt-0">
            <div className="h-full rounded-lg overflow-hidden border border-neutral-sand">
              <div className="h-full relative">
                <img 
                  src="/uploads/sections/New_Kama_is_Kind_page_1.png" 
                  alt="Ayurvedic Products Collection" 
                  className="w-full h-full object-cover" 
                />
                
                {/* Hotspot 1 - Left Center */}
                <div className="absolute left-[20%] top-1/2 transform -translate-y-1/2 z-10 group cursor-pointer">
                  {/* Multi-layered Pulse Animation */}
                  <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-amber-300/30 to-primary/20 animate-ping"></div>
                  <div className="absolute w-14 h-14 rounded-full bg-gradient-to-r from-amber-400/40 to-primary/30 animate-pulse" style={{animationDuration: '2s'}}></div>
                  <div className="absolute w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/50 to-primary/40 animate-pulse" style={{animationDuration: '1.5s'}}></div>
                  
                  {/* Hotspot Button - Improved with gold gradient */}
                  <a 
                    href="/collections/kumkumadi" 
                    className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-primary shadow-xl hover:from-amber-500 hover:to-primary-dark transition-all duration-300 border-2 border-amber-100"
                    aria-label="Shop Kumkumadi Collection"
                    style={{transform: 'scale(1)', transition: 'transform 0.2s ease-in-out'}}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <span className="text-white drop-shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </span>
                  </a>
                  
                  {/* Enhanced Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute left-1/2 bottom-full mb-2 -translate-x-1/2 bg-gradient-to-r from-amber-50 to-white shadow-lg rounded-lg p-3 text-sm font-medium text-primary-dark whitespace-nowrap transition-all duration-300 border border-amber-100 transform group-hover:scale-105">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </span>
                      Shop Kumkumadi Collection
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white transform rotate-45 border-r border-b border-amber-100"></div>
                  </div>
                </div>
                
                {/* Hotspot 2 - Right Center */}
                <div className="absolute right-[20%] top-1/2 transform -translate-y-1/2 z-10 group cursor-pointer">
                  {/* Multi-layered Pulse Animation */}
                  <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-teal-300/30 animate-ping"></div>
                  <div className="absolute w-14 h-14 rounded-full bg-gradient-to-r from-primary/30 to-teal-400/40 animate-pulse" style={{animationDuration: '2s'}}></div>
                  <div className="absolute w-12 h-12 rounded-full bg-gradient-to-r from-primary/40 to-teal-500/50 animate-pulse" style={{animationDuration: '1.5s'}}></div>
                  
                  {/* Hotspot Button - Improved with teal gradient */}
                  <a 
                    href="/collections/amrepa" 
                    className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-primary to-teal-500 shadow-xl hover:from-primary-dark hover:to-teal-600 transition-all duration-300 border-2 border-teal-100"
                    aria-label="Shop Amrepa Collection"
                    style={{transform: 'scale(1)', transition: 'transform 0.2s ease-in-out'}}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <span className="text-white drop-shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 15M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                  </a>
                  
                  {/* Enhanced Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute left-1/2 bottom-full mb-2 -translate-x-1/2 bg-gradient-to-r from-white to-teal-50 shadow-lg rounded-lg p-3 text-sm font-medium text-primary-dark whitespace-nowrap transition-all duration-300 border border-teal-100 transform group-hover:scale-105">
                    <div className="flex items-center gap-2">
                      <span className="text-teal-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </span>
                      Shop Amrepa Collection
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white transform rotate-45 border-r border-b border-teal-100"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dot indicators for mobile */}
        <div className="flex justify-center mt-4 md:hidden">
          <span className="h-2 w-2 rounded-full bg-primary mx-1"></span>
          <span className="h-2 w-2 rounded-full bg-gray-300 mx-1"></span>
          <span className="h-2 w-2 rounded-full bg-gray-300 mx-1"></span>
        </div>
      </div>
    </section>
  );
}