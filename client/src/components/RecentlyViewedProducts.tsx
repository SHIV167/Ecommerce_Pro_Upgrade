import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@shared/schema';
import ProductCard from './products/ProductCard';
import { fetchProductById } from '@/services/productService';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const RecentlyViewedProducts = () => {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentlyViewed') || '[]';
    setViewedIds(JSON.parse(stored));
  }, []);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['recentlyViewed', viewedIds],
    queryFn: async () => {
      if (viewedIds.length === 0) return [];
      const results = await Promise.all(viewedIds.map(id => fetchProductById(id)));
      return results.filter((p): p is Product => p !== null);
    },
    enabled: viewedIds.length > 0,
  });

  if (isLoading || products.length === 0) {
    return null;
  }

  const PrevArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
      <button
        className={className}
        style={{ ...style, display: 'block', background: 'white', borderRadius: '50%' }}
        onClick={onClick}
        aria-label="Previous"
      >
        &#10094;
      </button>
    );
  };

  const NextArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
      <button
        className={className}
        style={{ ...style, display: 'block', background: 'white', borderRadius: '50%' }}
        onClick={onClick}
        aria-label="Next"
      >
        &#10095;
      </button>
    );
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Recently Viewed</h2>
        <Slider {...sliderSettings} className="px-4">
          {products.map(prod => (
            <div key={prod._id} className="p-2">
              <ProductCard product={prod} />
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;