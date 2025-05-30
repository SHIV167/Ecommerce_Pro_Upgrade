import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import '@/styles/blog-listing.css';
import LatestPost from '@/components/blog/LatestPost';
import BlogBannerSlider from '@/components/blog/BlogBannerSlider';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  author: string;
  publishedAt: string;
  summary: string;
  content?: string;
  imageUrl?: string;
  category?: string;
}

export default function BlogsPage() {
  const { data: blogs = [], isLoading } = useQuery<Blog[]>({
    queryKey: ['/api/blogs'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blogs');
      return res.json();
    },
  });

  // Sample blog data for the screenshot-matching design
  const sampleBlogs: Blog[] = [
    {
      _id: '1',
      title: 'Kumkumadi Serum: Your glow boosting serum in a Bottle',
      slug: 'kumkumadi-serum-glow-boosting',
      author: 'Kama Ayurveda',
      publishedAt: new Date('2025-05-20').toISOString(),
      summary: 'Glowing skin is a universal beauty goal, yet achieving it often feels challenging. Modern skincare routines are filled with countless [...] ',
      imageUrl: '/uploads/blog/kumkumadi-serum.jpg',
      category: 'Skincare'
    },
    {
      _id: '2',
      title: 'Brighten Eyes, Naturally: Meet the Kumkumadi Eye Serum',
      slug: 'brighten-eyes-naturally-kumkumadi-eye-serum',
      author: 'Kama Ayurveda',
      publishedAt: new Date('2025-05-18').toISOString(),
      summary: 'The skin around our eyes is the most delicate and thinnest on the face, making it more prone to signs [...] ',
      imageUrl: '/uploads/blog/kumkumadi-eye-serum.jpg',
      category: 'Ayurveda'
    },
    {
      _id: '3',
      title: 'How To Use Henna and Indigo Powder As Natural Hair Dye?',
      slug: 'how-to-use-henna-indigo-natural-hair-dye',
      author: 'Kama Ayurveda',
      publishedAt: new Date('2025-05-15').toISOString(),
      summary: 'Henna hair dye is the most common way to color grey hair and has become a part of the hair care routine of many people. However, many people do not know the correct way to use it. To help you [...] ',
      imageUrl: '/uploads/blog/henna-indigo-natural-hair-dye.jpg',
      category: 'Natural Remedies'
    },
    {
      _id: '4',
      title: 'Aloe, Shea, Tea Tree - Top 10 Natural Anti-Acne Ingredients',
      slug: 'natural-anti-acne-ingredients',
      author: 'Kama Ayurveda',
      publishedAt: new Date('2025-05-12').toISOString(),
      summary: 'Discover the top natural ingredients to fight acne effectively.',
      imageUrl: '/uploads/blog/anti-acne.jpg',
      category: 'Skincare'
    }
  ];

  // Categories data
  const categories = [
    { name: 'Skincare', count: 12 },
    { name: 'Hair Care', count: 8 },
    { name: 'Wellness', count: 10 },
    { name: 'Ayurveda', count: 15 },
    { name: 'Natural Remedies', count: 6 },
    { name: 'Product Guides', count: 9 },
  ];

  const displayBlogs = blogs.length > 0 ? blogs : sampleBlogs;

  // Add the blog-listing class to the body for scoped styling
  useEffect(() => {
    document.body.classList.add('blog-listing-page');
    return () => {
      document.body.classList.remove('blog-listing-page');
    };
  }, []);

  if (isLoading) {
    return (
      <div className="blog-listing-container">
        <div className="blog-listing-header">
          <h1>BLOG</h1>
        </div>
        <div className="blog-listing-content">
          <div className="blog-listing-main">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="blog-listing-card loading">
                <div className="blog-listing-image"></div>
                <div className="blog-listing-details">
                  <h3 className="loading-text"></h3>
                  <p className="loading-text"></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-listing-page">
      <Helmet>
        <title>Blog | Kama Ayurveda</title>
        <meta name="description" content="Discover our latest blog posts about Ayurveda, skincare, and wellness." />
      </Helmet>
      
      {/* Blog Banner Slider at the top of the page */}
      <BlogBannerSlider />

      <div className="blog-listing-header">
        <h1>Top Blogs</h1>
      </div>

      <div className="blog-listing-container">
        <main className="blog-listing-main">
          <div className="blog-posts-list">
            {displayBlogs.map((blog) => (
              <article key={blog._id} className="blog-post-item">
                <div className="blog-post-content">
                  <h2>{blog.title}</h2>
                  <p>{blog.summary.length > 120 ? blog.summary.substring(0, 120) + ' [...]' : blog.summary}</p>
                  <Link href={`/blogs/${blog.slug}`} className="read-more-link">
                    Read more
                  </Link>
                </div>
                <div className="blog-post-image">
                  <img 
                    src={blog.imageUrl || '/uploads/blog/placeholder.jpg'} 
                    alt={blog.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/uploads/blog/placeholder.jpg';
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </main>

        <aside className="blog-listing-sidebar">
          <div className="blog-listing-widget categories-widget">
            <h3>Categories</h3>
            <ul>
              {categories.map((category, index) => (
                <li key={index}>
                  <Link href={`/blogs/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    {category.name}
                    <span>({category.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="blog-listing-widget recent-posts-widget">
            <h3>Recent Posts</h3>
            <ul>
              {displayBlogs.slice(0, 4).map((blog) => (
                <li key={`recent-${blog._id}`}>
                  <Link href={`/blogs/${blog.slug}`}>
                    <div className="recent-post">
                      <div className="recent-post-image">
                        <img 
                          src={blog.imageUrl || '/uploads/blog/placeholder.jpg'} 
                          alt={blog.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/blog/placeholder.jpg';
                          }}
                        />
                      </div>
                      <div className="recent-post-details">
                        <h4>{blog.title}</h4>
                        <span className="date">
                          {new Date(blog.publishedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      
      {/* Latest Post Section */}
      {displayBlogs.length > 0 && (
        <LatestPost post={displayBlogs[0]} />
      )}
    </div>
  );
}
