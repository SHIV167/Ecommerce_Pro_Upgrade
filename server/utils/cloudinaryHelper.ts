/**
 * Utility functions for optimizing Cloudinary URLs
 */

/**
 * Optimizes a Cloudinary URL by adding transformation parameters
 * and ensuring HTTPS protocol
 * 
 * @param url The original Cloudinary URL
 * @param options Configuration options for the transformation
 * @returns Optimized Cloudinary URL
 */
export const optimizeCloudinaryUrl = (
  url: string,
  options: {
    width?: number;
    quality?: string;
    format?: string;
    responsive?: boolean;
    isDesktop?: boolean;
  } = {}
): string => {
  // Return early if not a Cloudinary URL
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Ensure HTTPS protocol
  let optimizedUrl = url.startsWith('http://')
    ? url.replace('http://', 'https://')
    : url;

  // Don't add transformations if they're already present
  if (optimizedUrl.includes('/upload/') && !optimizedUrl.includes('/upload/q_')) {
    // Build transformation string
    const quality = options.quality || 'auto:good';
    const format = options.format || 'auto';
    const width = options.width 
      ? `w_${options.width},` 
      : options.isDesktop 
        ? '' 
        : 'w_768,';
    
    const responsiveParam = options.responsive ? 'c_limit,' : '';
    const dprParam = 'dpr_auto,';
    const progressiveParam = 'fl_progressive,';
    
    // Combine all parameters
    const transformationString = `${width}q_${quality},f_${format},${dprParam}${progressiveParam}${responsiveParam}`;
    
    // Insert transformation parameters
    optimizedUrl = optimizedUrl.replace('/upload/', `/upload/${transformationString}`);
  }

  return optimizedUrl;
};

/**
 * Creates optimized URLs for banner images based on their type (desktop/mobile)
 * 
 * @param url The original image URL
 * @param isDesktop Whether this is a desktop image (true) or mobile image (false)
 * @returns Optimized URL
 */
export const optimizeBannerImageUrl = (url: string, isDesktop: boolean): string => {
  return optimizeCloudinaryUrl(url, {
    quality: 'auto:good',
    format: 'auto',
    responsive: true,
    isDesktop,
    width: isDesktop ? undefined : 768
  });
};

export default {
  optimizeCloudinaryUrl,
  optimizeBannerImageUrl
};
