import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { apiRequest } from '@/lib/queryClient';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  imageUrl?: string;
  publishedAt: string;
}

export default function BlogSlider() {
  const { data: blogs = [] } = useQuery({
    queryKey: ['/api/blogs'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blogs');
      return res.json();
    }
  });

  // Add useEffect to initialize slider after render
  React.useEffect(() => {
    // Ensure slick refresh if blogs are loaded after component mount
    const sliderElem = document.querySelector('.blog-slider');
    if (sliderElem && typeof (window as any).jQuery !== 'undefined') {
      try {
        (window as any).jQuery('.blog-slider').slick('refresh');
      } catch (e) {
        console.log('Slick not initialized yet');
      }
    }
  }, [blogs]);

  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="py-16 px-4 md:px-8 relative">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-medium font-serif mb-4 sm:mb-0">Kama Blog</h2>
          <Link to="/blogs" className="text-sm text-primary hover:underline">
            Explore All Blogs
          </Link>
        </div>
        
        {/* Added key based on blogs length to force re-render when blogs change */}
        <Slider
          key={`blog-slider-${blogs.length}`}
          dots={true}
          dotsClass="slick-dots custom-slick-dots"
          infinite={blogs.length > 3}
          speed={500}
          slidesToShow={3}
          slidesToScroll={1}
          arrows={true}
          autoplay={true}
          autoplaySpeed={5000}
          pauseOnHover={true}
          className="blog-slider"
          responsive={[
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 1,
                arrows: true,
                dots: true
              }
            },
            {
              breakpoint: 640,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                dots: true
              }
            }
          ]}
        >
          {blogs.map((blog: Blog, index: number) => (
            <div key={`${blog._id}-${index}`} className="px-2">
              <Link to={`/blogs/${blog.slug}`} className="block group">
                <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded">
                  <img
                    src={blog.imageUrl || '/uploads/blog-default-banner.jpg'}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => (e.currentTarget.src = '/uploads/blog-default-banner.jpg')}
                  />
                </div>
                <h3 className="text-lg font-medium mb-2 group-hover:text-amber-500 transition-colors">
                  {blog.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {blog.summary}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(blog.publishedAt).toLocaleDateString()}
                </p>
              </Link>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}