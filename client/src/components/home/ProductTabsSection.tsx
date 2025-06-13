import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import ProductCard from "@/components/products/ProductCard";

const tabs = [
  { key: "bestsellers", label: "Bestsellers" },
  { key: "new", label: "New Launches" },
  { key: "featured", label: "Featured Ayurvedic Products" },
];

const PrevArrow = ({ onClick }: any) => (
  <button onClick={onClick} className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow z-10">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);
const NextArrow = ({ onClick }: any) => (
  <button onClick={onClick} className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow z-10">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);

export default function ProductTabsSection() {
  const [activeTab, setActiveTab] = useState("bestsellers");
  const { data: bestsellers = [], isLoading: loadingBest } = useQuery<Product[]>({ queryKey: ["/api/products/bestsellers?limit=5"] });
  const { data: newProducts = [], isLoading: loadingNew } = useQuery<Product[]>({ queryKey: ["/api/products/new?limit=5"] });
  const { data: featured = [], isLoading: loadingFeatured } = useQuery<Product[]>({ queryKey: ["/api/products/featured?limit=5"] });

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  const renderSlider = (items: Product[], loading: boolean) => (
    <Slider {...settings} className="px-4">
      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-2 bg-white animate-pulse">
              <div className="mb-4 w-full h-64 bg-neutral-sand"></div>
              <div className="w-24 h-3 bg-neutral-sand mb-2"></div>
            </div>
          ))
        : items.map((product) => (
            <div key={product._id || product.slug} className="p-2">
              <ProductCard product={product} showAddToCart />
            </div>
          ))}
    </Slider>
  );

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary font-semibold"
                  : "text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "bestsellers" && renderSlider(bestsellers, loadingBest)}
        {activeTab === "new" && renderSlider(newProducts, loadingNew)}
        {activeTab === "featured" && renderSlider(featured, loadingFeatured)}
      </div>
    </section>
  );
}
