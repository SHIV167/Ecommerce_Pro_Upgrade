import React from 'react';
import { Link } from 'wouter';
import '../../styles/latest-post.css';

interface LatestPostProps {
  post: {
    slug: string;
    title: string;
    summary: string;
    imageUrl?: string;
    category?: string;
    publishedAt: string;
  };
}

export default function LatestPost({ post }: LatestPostProps) {
  const date = new Date(post.publishedAt);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  return (
    <div className="latest-post-container">
      <h2 className="latest-post-heading">Latest Post</h2>
      
      <div className="latest-post-content">
        <div className="latest-post-image">
          <img 
            src={post.imageUrl || '/uploads/blog/placeholder.jpg'} 
            alt={post.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/uploads/blog/placeholder.jpg';
            }}
          />
          
          {/* Overlay text that appears on the image */}
          <div className="latest-post-overlay-text">
            <h3>Home remedies for<br />dry skin - 10 ways to<br />soothe dryness</h3>
          </div>
        </div>
        
        <div className="latest-post-details">
          <div className="latest-post-meta">
            <span className="latest-post-category">{post.category || 'BEAUTY'} | {month.toUpperCase()} {year}</span>
            <span className="latest-post-readtime">3 MINS READ</span>
          </div>
          
          <h3 className="latest-post-title">{post.title}</h3>
          
          <p className="latest-post-summary">
            Understanding the root cause of skin dryness can often be challenging. External factors like changes in weather, arid climates while [...]                        
          </p>
          
          <Link href={`/blogs/${post.slug}`} className="continue-reading-btn">
            Continue Reading
          </Link>
        </div>
      </div>
    </div>
  );
}
