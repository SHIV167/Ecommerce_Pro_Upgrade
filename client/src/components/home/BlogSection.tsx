import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '@/styles/blog-section.css';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  imageUrl: string;
}

export default function BlogSection() {
  const { data: blogs = [] } = useQuery<Blog[]>({
    queryKey: ['/api/blogs'],
    queryFn: async () => {
      const res = await fetch('/api/blogs');
      return res.json();
    }
  });

  // Sample blog data for testing
  const sampleBlogs = [
    {
      _id: '1',
      title: '20 Best Tan Removal Face Packs To Remove Sun Tan',
      slug: 'tan-removal-face-packs',
      summary: 'There is a big difference between a healthy tan and an excessive tan. A healthy tan is when you have [...]',
      imageUrl: '/images/blogs/tan-removal.jpg'
    },
    {
      _id: '2',
      title: 'How To Remove Tan Naturally Using Home Remedies?',
      slug: 'remove-tan-naturally',
      summary: 'Summer brings with it the promise of fun-filled beach days and sun-kissed memories. But as we soak up the sun [...]',
      imageUrl: '/images/blogs/natural-tan-removal.jpg'
    },
    {
      _id: '3',
      title: 'Which sunscreen lotion is the best for you?',
      slug: 'best-sunscreen-lotion',
      summary: 'You might have heard a lot of people telling you the importance of using sunscreen lotion daily. Even when you [...]',
      imageUrl: '/images/blogs/sunscreen-guide.jpg'
    }
  ];

  const displayBlogs = blogs.length > 0 ? blogs : sampleBlogs;

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-heading text-2xl text-primary">Kama Blog</h2>
          <Link href="/blogs" className="text-sm text-gray-600 hover:text-primary">
            Explore All Blogs
          </Link>
        </div>
        <div className="blog-slider-container">
          <Slider {...settings}>
            {displayBlogs.map((blog) => (
              <div key={blog._id} className="px-3">
                <Link href={`/blogs/${blog.slug}`} className="block group">
                  <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-lg">
                    <img
                      src={blog.imageUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {blog.summary}
                  </p>
                  <div className="mt-4">
                    <span className="text-primary text-sm font-medium group-hover:underline">
                      Read More
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
}
