import React, { useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Product } from '@/types/product';
import { FaFacebook, FaTwitter, FaPinterest, FaEnvelope, FaLinkedin } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '@/styles/blog-post.css';
import '@/styles/blog-slider.css';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  author: string;
  publishedAt: string;
  summary: string;
  content: string;
  imageUrl?: string;
  relatedProducts?: string[];
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{[key: string]: HTMLElement | null}>({});

  const { data: blog, isError, isLoading } = useQuery<Blog, Error>({
    queryKey: ['/api/blogs', slug],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/blogs/${slug}`);
      if (!res.ok) throw new Error('Blog not found');
      return res.json() as Promise<Blog>;
    },
    enabled: !!slug,
  });
  
  // Fetch related products if available
  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/related', blog?.relatedProducts],
    queryFn: async () => {
      if (!blog?.relatedProducts?.length) return [];
      const productIds = blog.relatedProducts.join(',');
      const res = await apiRequest('GET', `/api/products/byIds?ids=${productIds}`);
      return res.json();
    },
    enabled: !!blog?.relatedProducts?.length,
  });

  // Fetch bestseller products for featured product section
  const { data: bestsellerProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/bestsellers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/products/bestsellers');
      return res.json();
    },
    enabled: true,
  });
  
  // Fetch all blogs for the related blogs slider
  const { data: allBlogs = [] } = useQuery<Blog[]>({
    queryKey: ['/api/blogs'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blogs');
      return res.json();
    },
    enabled: true,
  });
  
  // Filter out the current blog from the related blogs
  const relatedBlogs = allBlogs.filter(b => b.slug !== slug);

  // Detect headings in blog content for highlights section
  useEffect(() => {
    if (blog && contentRef.current) {
      // Add blog-post-page class to body
      document.body.classList.add('blog-post-page');
      
      // Find all h2 and h3 elements in the content
      const headings = contentRef.current.querySelectorAll('h2, h3');
      headings.forEach(heading => {
        // Create an id from the heading text if it doesn't have one
        if (!heading.id) {
          const id = heading.textContent?.toLowerCase().replace(/[^\w]+/g, '-') || '';
          heading.id = id;
          sectionRefs.current[id] = heading as HTMLElement;
        } else {
          sectionRefs.current[heading.id] = heading as HTMLElement;
        }
      });
    }
    
    return () => {
      // Clean up when component unmounts
      document.body.classList.remove('blog-post-page');
    };
  }, [blog]);
  
  // Initialize blog slider
  useEffect(() => {
    if (relatedBlogs.length > 0) {
      // Initialize slider after component mount and when related blogs change
      const timer = setTimeout(() => {
        const sliderElem = document.querySelector('.blog-slider');
        if (sliderElem && typeof (window as any).jQuery !== 'undefined') {
          try {
            (window as any).jQuery('.blog-slider').slick('unslick');
            (window as any).jQuery('.blog-slider').slick();
          } catch (e) {
            console.log('Slick initialization error:', e);
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [relatedBlogs]);
  
  // Scroll to section when clicking on highlight item
  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id];
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100, // Offset for header
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) return (
    <div className="min-h-screen">
      <div className="blog-container">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 rounded"></div>
            <div className="h-5 bg-gray-200 rounded w-5/6"></div>
            <div className="h-5 bg-gray-200 rounded w-4/6"></div>
            <div className="h-5 bg-gray-200 rounded w-5/6"></div>
            <div className="h-5 bg-gray-200 rounded w-3/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
  
  if (isError || !blog) return (
    <div className="min-h-screen py-10">
      <div className="blog-container">
        <div className="max-w-3xl mx-auto p-8 text-center bg-white rounded shadow-sm">
          <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist or has been moved.</p>
          <Link href="/blogs" className="text-primary hover:text-primary-dark underline">Return to all blogs</Link>
        </div>
      </div>
    </div>
  );

  // Extract headings for highlights section
  const extractHeadings = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h2, h3'));
    
    return headings.map(heading => ({
      id: heading.id || heading.textContent?.toLowerCase().replace(/[^\w]+/g, '-') || '',
      text: heading.textContent || ''
    }));
  };

  // Format date to display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const headings = blog?.content ? extractHeadings(blog.content) : [];
  const readingTime = blog?.content ? Math.ceil(blog.content.split(' ').length / 200) : 5; // Estimate reading time

  return (
    <>
      <Helmet>
        <title>{blog?.title || 'Blog Post'} | Kama Ayurveda</title>
        <meta name="description" content={blog?.summary || ''} />
        {blog?.imageUrl && <meta property="og:image" content={blog.imageUrl} />}
      </Helmet>
      
      <div className="min-h-screen">
        {/* Full-width blog header banner with background image - responsive height */}
        <div className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] bg-cover bg-center" 
          style={{ backgroundImage: `url(${blog?.imageUrl || '/uploads/blog-default-banner.jpg'})` }}>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        {/* White background section with navigation and title - positioned to overlap with banner */}
        <div className="relative z-20 max-w-4xl mx-auto -mt-16 sm:-mt-24 md:-mt-32 px-4">
          <div className="bg-white p-6 sm:p-8 shadow-md rounded-sm">
            {/* Breadcrumb navigation */}
            <div className="text-xs uppercase mb-4 text-gray-500 flex flex-wrap items-center">
              <Link href="/" className="hover:text-primary">HOME</Link>
              <span className="mx-2">❯</span>
              <Link href="/blogs" className="hover:text-primary">BLOG</Link>
              <span className="mx-2">❯</span>
              <span className="uppercase truncate max-w-[150px] sm:max-w-none text-primary">{blog?.title?.split(' ').slice(0, 3).join(' ')}</span>
            </div>
            
            {/* Blog title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-4">{blog?.title}</h1>
            
            {/* Author info and date */}
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <div>Authored by: <span className="font-medium text-gray-700">{blog?.author || 'Shreya Dalela'}</span></div>
              <div className="flex items-center ml-4">
                <span className="text-gray-500">{blog ? formatDate(blog.publishedAt) : '16 March 2020'}</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-amber-600">{readingTime} min read</span>
              </div>
            </div>
            
            {/* Like and share section */}
            <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
              <button className="flex items-center text-gray-600 hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm">Like</span>
              </button>
              
              <button className="flex items-center text-gray-600 hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="blog-container py-6 sm:py-8 pb-12 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm mt-12">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main content - order-2 on mobile, order-1 on lg */}
            <div className="w-full lg:w-2/3 order-2 lg:order-1">
              {/* Blog content */}
              <div className="p-4 sm:p-6 md:p-8">
                {/* Title and meta */}
                <div className="text-left mb-8 pb-4">
                  <div className="p-4 sm:p-6 md:p-8 bg-white/80 rounded-lg shadow-sm">
                    <div className="blog-meta flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 mb-6">
                      <div className="blog-author">Authored by: <span className="font-medium">{blog.author}</span></div>
                      <div className="blog-date flex flex-wrap items-center">
                        <span>{formatDate(blog.publishedAt)}</span>
                        <span className="blog-date-divider">•</span>
                        <span className="blog-reading-time">{readingTime} min read</span>
                      </div>
                    </div>

                    {/* Blog image is now used as banner at the top of the page */}

                    {/* Blog content */}
                    <div 
                      ref={contentRef}
                      className="blog-content prose max-w-none" 
                      dangerouslySetInnerHTML={{ __html: blog.content }} 
                    />
                    
                    {/* Share buttons */}
                    <div className="blog-share flex flex-wrap items-center">
                      <div className="blog-share-label mr-3 mb-2">Share</div>
                      <div className="blog-share-buttons flex flex-wrap">
                        <button aria-label="Share on Facebook" className="mb-2">
                          <FaFacebook className="text-[#3b5998]" size={18} />
                        </button>
                        <button aria-label="Share on Twitter" className="mb-2">
                          <FaTwitter className="text-[#1da1f2]" size={18} />
                        </button>
                        <button aria-label="Share on Pinterest" className="mb-2">
                          <FaPinterest className="text-[#bd081c]" size={18} />
                        </button>
                        <button aria-label="Share by Email" className="mb-2">
                          <FaEnvelope className="text-gray-600" size={18} />
                        </button>
                        <button aria-label="Share on LinkedIn" className="mb-2">
                          <FaLinkedin className="text-[#0077b5]" size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Author info */}
                    <div className="blog-author-section flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                      <div className="blog-author-avatar mb-4 sm:mb-0">
                        <img 
                          src="https://blog.kamaayurveda.com/wp-content/uploads/2022/03/avatar_user_20_1647310804.png" 
                          alt={blog.author} 
                          className="mx-auto sm:mx-0 w-16 h-16 sm:w-20 sm:h-20"
                          onError={(e) => (e.currentTarget.src = '/uploads/default-avatar.jpg')}
                        />
                      </div>
                      <div className="blog-author-info">
                        <h3 className="text-lg sm:text-xl">About {blog.author}</h3>
                        <p className="blog-author-bio text-sm sm:text-base">
                          Expert in Ayurvedic skincare and wellness. Passionate about sharing knowledge on natural beauty remedies and traditional Ayurvedic practices for modern living.
                        </p>
                      </div>
                    </div>
                    
                    {/* Was this article helpful? */}
                    <div className="mt-6 py-4">
                      <h3 className="text-lg font-medium mb-3">Was this article helpful?</h3>
                      <div className="flex space-x-3">
                        <button className="px-5 py-2 bg-primary text-white rounded-sm hover:bg-primary-dark transition-colors text-sm font-medium">
                          Yes
                        </button>
                        <button className="px-5 py-2 border border-primary text-primary rounded-sm hover:bg-gray-100 transition-colors text-sm font-medium">
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Related products */}
                {relatedProducts.length > 0 && (
                  <div className="mt-12 pt-8 bg-white/80 rounded-lg shadow-sm p-4 sm:p-6">
                    <h2 className="text-2xl font-serif font-medium mb-6 text-center">Products Mentioned</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                      {relatedProducts.map(product => (
                        <div key={product._id} className="flex flex-col items-center">
                          <Link href={`/products/${product.slug}`} className="block w-full">
                            <div className="aspect-square overflow-hidden rounded-md mb-3 bg-gray-50">
                              <img 
                                src={product.images?.[0] || product.imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-transform hover:scale-105" 
                              />
                            </div>
                            <h3 className="text-sm font-medium text-center">{product.name}</h3>
                            <p className="text-sm text-center text-primary font-medium mt-1">₹{product.price}</p>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar - order-1 on mobile, order-2 on lg */}
            <div className="w-full lg:w-1/3 space-y-4 sm:space-y-6 px-4 sm:px-0 order-1 lg:order-2 mb-8 lg:mb-0">
              {/* Highlights box */}
              <div className="blog-highlights bg-white shadow-sm">
                <h3 className="blog-highlights-title">Highlights</h3>
                <ul className="blog-highlights-list">
                  {headings.map((heading) => (
                    <li key={heading.id} className="blog-highlights-item">
                      <a 
                        href={`#${heading.id}`} 
                        className="blog-highlights-link"
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(heading.id);
                        }}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Featured Product - Using Bestsellers */}
              <div className="blog-highlights">
                <h3 className="blog-highlights-title">Featured Products</h3>
                <div className="space-y-4">
                  {bestsellerProducts.slice(0, 3).map((product) => (
                    <div key={product._id} className="flex items-start hover:bg-gray-50 p-2 rounded transition-colors">
                      <div className="w-16 h-16 overflow-hidden flex-shrink-0 bg-gray-100 mr-3 rounded">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">{product.name}</h4>
                        <p className="text-primary text-sm font-semibold">₹{product.price.toFixed(2)}</p>
                        <Link href={`/products/${product.slug}`} className="text-xs text-primary hover:underline">View Product</Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link 
                    href="/products?collection=bestsellers" 
                    className="block w-full text-center border border-primary text-primary py-2 px-4 rounded-sm hover:bg-primary hover:text-white transition-colors text-sm font-medium"
                  >
                    View All Bestsellers
                  </Link>
                </div>
              </div>
              
              {/* Intentionally removed - moved below author section */}
              
              {/* Newsletter signup */}
              <div className="blog-highlights">
                <h3 className="blog-highlights-title">Subscribe to Our Newsletter</h3>
                <p className="text-sm text-gray-600 mb-4">Get the latest articles and product updates</p>
                <form className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="Your email address" 
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                  />
                  <button 
                    type="submit" 
                    className="w-full bg-primary text-white py-2 px-4 rounded-sm hover:bg-primary-dark transition-colors text-sm font-medium"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          {/* Related blog posts - Dynamic slider like the one on homepage */}
          <div className="my-8 sm:my-12 px-4 sm:px-0 py-6 bg-white/80 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-serif">Kama Blog</h2>
              <Link href="/blogs" className="text-primary text-sm hover:underline">Explore All Blogs</Link>
            </div>
            
            {relatedBlogs.length > 0 ? (
              <Slider
                key={`blog-slider-${relatedBlogs.length}`}
                dots={true}
                dotsClass="slick-dots custom-slick-dots"
                infinite={relatedBlogs.length > 3}
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
                {relatedBlogs.map((relatedBlog, index) => (
                  <div key={`${relatedBlog._id}-${index}`} className="px-2">
                    <Link href={`/blogs/${relatedBlog.slug}`} className="block group">
                      <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded">
                        <img
                          src={relatedBlog.imageUrl || '/uploads/blog-default-banner.jpg'}
                          alt={relatedBlog.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => (e.currentTarget.src = '/uploads/blog-default-banner.jpg')}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                          <h3 className="text-white text-xl font-medium">{relatedBlog.title}</h3>
                          <div className="text-white/80 text-sm mt-2">
                            <span className="text-white hover:underline">Read More</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No related blog posts available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}