import { useParams } from 'wouter';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Product, Category as CategoryType } from '@shared/schema';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Helmet } from 'react-helmet';
import HeaderBanner from '@/components/layout/HeaderBanner';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

// Type definitions for featured products from the server
type FeaturedProductVariant = {
  size: string;
  price: number;
  isDefault: boolean; // Make sure isDefault is required and not optional
  imageUrl?: string;
};

interface Stat {
  percent: number;
  text: string;
}

interface FeaturedProduct {
  productId: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  position: number;
  layout: 'image-right' | 'image-left';
  variants: FeaturedProductVariant[];
  benefits: string[];
  stats: Stat[];
}

// Define the extended category type without extending CategoryType to avoid conflicts
interface ExtendedCategory {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  featured?: boolean;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  featuredProducts: FeaturedProduct[];
}

export default function CategoryPage() {
  const { slug } = useParams();
  if (!slug) return null;

  const [sortBy, setSortBy] = useState('featured');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };
  
  // Handle variant selection
  const handleVariantSelect = (productId: string, size: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: size
    }));
  };

  // Featured products add-to-cart handler: fetch product by ID then add
  const handleAddToCartFeatured = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error(`Failed to fetch product ${productId}`);
      const prod: Product = await res.json();
      await addItem(prod);
      toast({ title: 'Added to cart', description: `${prod.name} has been added to your cart.` });
    } catch (error) {
      console.error('Add featured product error:', error);
      toast({ title: 'Error', description: `Failed to add product to cart. Please try again.`, variant: 'destructive' });
    }
  };

  const { data: category, isLoading: catLoading } = useQuery<ExtendedCategory>({
    queryKey: [`/api/categories/${slug}`],
    queryFn: async () => {
      console.log('Fetching category with slug:', slug);
      try {
        // Simple direct fetch
        const res = await fetch(`/api/categories/${slug}`);
        console.log('Category response status:', res.status);
        
        if (!res.ok) {
          console.error('Error fetching category:', res.status, res.statusText);
          throw new Error(`Failed to fetch category: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Category data loaded:', data);
        
        // Ensure featuredProducts is properly initialized
        if (!data.featuredProducts) {
          console.log('Adding empty featuredProducts array');
          data.featuredProducts = [];
        }
        
        // Debug the featuredProducts data
        console.log('Featured products in category:', data.featuredProducts);
        if (data.featuredProducts.length > 0) {
          console.log('First featured product:', data.featuredProducts[0]);
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching category data:', error);
        throw error;
      }
    },
    enabled: !!slug,
    staleTime: 0, // Disable caching to ensure fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    retry: 3 // Retry failed requests up to 3 times
  });

  const productsQuery = useQuery<Product[]>({
    queryKey: ['products', category?._id],
    queryFn: async () => {
      const res = await fetch(`/api/products?categoryId=${category?._id}`);
      const json = await res.json();
      // API returns { products, total, ... }
      return (json.products ?? json.data ?? []) as Product[];
    },
    enabled: Boolean(category?._id),
  });
  const products = productsQuery.data ?? [];
  const productsLoading = productsQuery.isLoading;

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'rating': return (b.rating ?? 0) - (a.rating ?? 0);
      default:
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
    }
  });

  const isLoading = catLoading || productsLoading;

  if (isLoading) return <div>Loading...</div>;
  if (!category) return <div>Category not found</div>;

  return (
    <>
      <Helmet>
        <title>{category.name} | Shop</title>
        <meta name="description" content={category.description || ''} />
      </Helmet>
      <HeaderBanner slug={slug} />
      
      {/* Category Heading */}
      <div className="bg-white py-10 border-b border-neutral-100">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl text-primary mb-3">{category.name}</h1>
          <p className="text-neutral-gray max-w-2xl mx-auto text-lg">{category.description || 'Ayurvedic skincare formulations for radiant skin'}</p>
        </div>
      </div>
      
      {/* Dynamic Featured Product Sections */}
      {console.log('Featured products data:', category?.featuredProducts)}
      
      {/* Dynamic Featured Product Sections */}
      <div className="mb-10">
        {/* <h2 className="text-2xl font-heading text-center mb-8">Featured Products</h2> */}
        {/* Debug information */}
        <div style={{ display: 'none' }}>
          Featured Products Data: {JSON.stringify(category?.featuredProducts)}
        </div>
      </div>
      
      {console.log('Rendering featured products, count:', category?.featuredProducts?.length || 0)}
      
      {(Array.isArray(category?.featuredProducts) && category.featuredProducts.length > 0) ? (
        // Sort featured products by position
        [...category.featuredProducts]
          .filter(fp => fp && typeof fp === 'object')
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((featuredProduct, index) => {
            console.log('Rendering featured product:', featuredProduct);
            
            // Safety checks
            if (!featuredProduct || !featuredProduct.productId) {
              console.error('Invalid featured product:', featuredProduct);
              return null;
            }
            
            // Ensure variants array exists
            const variants = Array.isArray(featuredProduct.variants) ? featuredProduct.variants : [];
            
            // Find the default variant or use the first one
            const defaultVariant = variants.find(v => v && v.isDefault) || variants[0] || { size: 'default', price: 0 };
            const currentVariant = selectedVariants[featuredProduct.productId] || defaultVariant?.size;
            const selectedVariantDetails = variants.find(v => v && v.size === currentVariant) || defaultVariant;
            
            // Find the corresponding product from product list if needed
            const product = sortedProducts.find(p => p._id === featuredProduct.productId || p.slug === featuredProduct.productId);
            
            return (
              <div key={featuredProduct.productId} className="relative overflow-hidden bg-white py-16 border-b border-neutral-100">
                <div className="container mx-auto px-4">
                  <div className={`flex flex-col ${featuredProduct.layout === 'image-left' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center max-w-6xl mx-auto`}>
                    {/* Text Content */}
                    <div className={`md:w-1/2 text-primary mb-8 md:mb-0 ${featuredProduct.layout === 'image-left' ? 'md:pl-8' : 'md:pr-8'}`}>
                      <div className="mb-6">
                        <p className="text-neutral-gray uppercase tracking-wider text-sm mb-2">{featuredProduct.subtitle || 'A Synergistic 2-step Ritual'}</p>
                        <h2 className="font-heading text-3xl md:text-4xl mb-2 text-primary">Step {index + 1}:</h2>
                        <h3 className="font-heading text-2xl md:text-3xl mb-4 text-primary">{featuredProduct.title}</h3>
                      </div>
                      
                      <div className="mb-8">
                        <p className="text-neutral-gray mb-6">{featuredProduct.description}</p>
                        
                        <div className="mt-8">
                          <h3 className="text-lg font-medium mb-3 text-primary">Advanced Formula, Clinically Proven Results</h3>
                          <ul className="space-y-2">
                            {featuredProduct.stats.map((stat, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-primary mr-2">{i + 1}.</span>
                                <span className="text-neutral-gray">{stat.percent}% {stat.text}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs mt-4 text-neutral-gray">*Based on clinical tests conducted over 15 days</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-neutral-gray">Select Size</p>
                          <div className="flex space-x-3">
                            {featuredProduct.variants.map((variant) => (
                              <button 
                                key={variant.size}
                                onClick={() => handleVariantSelect(featuredProduct.productId, variant.size)}
                                className={`${variant.size === currentVariant ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-gray hover:bg-neutral-50'} px-4 py-1.5 text-sm ${variant.size === currentVariant ? '' : 'hover:bg-neutral-50'}`}
                              >
                                {variant.size}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-xl font-medium text-primary">Price: ₹ {selectedVariantDetails?.price.toLocaleString('en-IN')}</p>
                        
                        <div className="flex space-x-4">
                          <a 
                            href={`/products/${product?.slug || featuredProduct.productId}.html`} 
                            className="border border-neutral-300 text-neutral-gray px-4 py-2 text-sm hover:bg-neutral-50 transition"
                          >
                            View Details
                          </a>
                          <button
                            onClick={() => handleAddToCartFeatured(featuredProduct.productId)}
                            className="bg-black text-white px-4 py-2 text-sm hover:bg-neutral-800 transition"
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Product Image */}
                    <div className="md:w-1/2 flex justify-center">
                      <div className="w-full flex justify-center items-center">
                        <img 
                          src={selectedVariantDetails.imageUrl || featuredProduct.imageUrl || '/uploads/backgrounds/moodshot_varuna_35ml.jpg'} 
                          alt={featuredProduct.title}
                          className="w-auto h-auto max-h-[650px] max-w-full object-contain z-10 relative" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
      ) : null}
      
      {category?.featuredProducts?.length > 0 && (
        <>
          {/* FAQs Section */}
          <div className="bg-white py-16">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="font-heading text-3xl text-primary mb-12 text-center">FAQs</h2>
              
              <div className="space-y-2">
                {/* FAQ Item 1 */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(0)} 
                    className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-neutral-50"
                  >
                    <span className="text-primary">What are the key ingredients of the Samsara Miraculous Glow Booster Serum?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-primary transition-transform ${openFaqIndex === 0 ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {openFaqIndex === 0 && (
                    <div className="px-6 py-4 bg-neutral-50 text-neutral-gray">
                      <p>The key ingredients of the Samsara Miraculous Glow Booster Serum include pure Kashmiri Saffron extract, Rose Distillate, Vetiver, and a blend of 12 precious herbs formulated according to ancient Ayurvedic principles. The serum also contains Vitamin C, Hyaluronic Acid, and natural antioxidants to enhance skin radiance and address uneven skin tone.</p>
                    </div>
                  )}
                </div>
                
                {/* FAQ Item 2 */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(1)} 
                    className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-neutral-50"
                  >
                    <span className="text-primary">Are the ingredients in the Varuna Exceptional Repair Serum safe for sensitive skin?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-primary transition-transform ${openFaqIndex === 1 ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {openFaqIndex === 1 && (
                    <div className="px-6 py-4 bg-neutral-50 text-neutral-gray">
                      <p>Yes, the Varuna Exceptional Repair Serum is formulated to be gentle and suitable for sensitive skin. All our ingredients are carefully selected and tested to minimize irritation. The natural Ayurvedic formulation avoids harsh chemicals, and the Fermented Vyasthapana Complex is particularly known for its skin-soothing properties. However, as with any skincare product, we recommend patch testing if you have extremely sensitive skin.</p>
                    </div>
                  )}
                </div>
                
                {/* FAQ Item 3 */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(2)} 
                    className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-neutral-50"
                  >
                    <span className="text-primary">Are these serums free of harmful chemicals like parabens and sulfates?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-primary transition-transform ${openFaqIndex === 2 ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {openFaqIndex === 2 && (
                    <div className="px-6 py-4 bg-neutral-50 text-neutral-gray">
                      <p>Absolutely. All our serums are 100% free from parabens, sulfates, silicones, mineral oils, synthetic fragrances, and other potentially harmful chemicals. We are committed to clean beauty formulations that harness the power of natural ingredients and traditional Ayurvedic wisdom without compromising on efficacy or safety.</p>
                    </div>
                  )}
                </div>
                
                {/* FAQ Item 4 */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(3)} 
                    className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-neutral-50"
                  >
                    <span className="text-primary">What ingredients in the Varuna Exceptional Repair Serum help with anti ageing?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-primary transition-transform ${openFaqIndex === 3 ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {openFaqIndex === 3 && (
                    <div className="px-6 py-4 bg-neutral-50 text-neutral-gray">
                      <p>The Varuna Exceptional Repair Serum contains several powerful anti-aging ingredients, including the Fermented Vyasthapana Firming Complex derived from 10 fermented anti-aging herbs. Key active ingredients include 7D Hyaluronic Acid for deep hydration, Acetyl Hexapeptide 8 to reduce wrinkle depth, Niacinamide for improved skin barrier function, and concentrated Vitamin C for collagen support and antioxidant protection. Together, these target fine lines, loss of firmness, and other visible signs of aging.</p>
                    </div>
                  )}
                </div>
                
                {/* FAQ Item 5 */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(4)} 
                    className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-neutral-50"
                  >
                    <span className="text-primary">How often should I use the Samsara Miraculous Glow Booster Serum?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-primary transition-transform ${openFaqIndex === 4 ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {openFaqIndex === 4 && (
                    <div className="px-6 py-4 bg-neutral-50 text-neutral-gray">
                      <p>For optimal results, we recommend using the Samsara Miraculous Glow Booster Serum twice daily—once in the morning and once in the evening. Apply 2-3 drops to cleansed skin, gently patting it in before following with your moisturizer. Consistent daily use will yield the best brightening and radiance-boosting effects.</p>
                    </div>
                  )}
                </div>
                
                {/* FAQ Item 6 */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(5)} 
                    className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-neutral-50"
                  >
                    <span className="text-primary">Can I use the Varuna Exceptional Repair Serum during the day?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-primary transition-transform ${openFaqIndex === 5 ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {openFaqIndex === 5 && (
                    <div className="px-6 py-4 bg-neutral-50 text-neutral-gray">
                      <p>While the Varuna Exceptional Repair Serum is primarily formulated as a night treatment to work with your skin's natural repair cycle during sleep, it can be used during the day as well. If using during daytime, always follow with a broad-spectrum SPF 30+ sunscreen, as some active ingredients may increase sun sensitivity. For most skin types, we recommend using it in the evening for optimal results.</p>
                    </div>
                  )}
                </div>
                
                {/* FAQ Item 7 */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(6)} 
                    className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-neutral-50"
                  >
                    <span className="text-primary">How should I incorporate the Samsara Miraculous Glow Booster into my skincare routine?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-primary transition-transform ${openFaqIndex === 6 ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {openFaqIndex === 6 && (
                    <div className="px-6 py-4 bg-neutral-50 text-neutral-gray">
                      <p>To incorporate the Samsara Miraculous Glow Booster into your routine, apply after cleansing and toning but before moisturizing. In the morning, layer it under your sunscreen. In the evening, it can be used before or after the Varuna Exceptional Repair Serum, depending on your preference. For enhanced results, use after an exfoliating treatment 1-2 times weekly to improve product absorption.</p>
                    </div>
                  )}
                </div>
                
                {/* FAQ Item 8 */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(7)} 
                    className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-neutral-50"
                  >
                    <span className="text-primary">How long will it take to see results with these serums?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-primary transition-transform ${openFaqIndex === 7 ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {openFaqIndex === 7 && (
                    <div className="px-6 py-4 bg-neutral-50 text-neutral-gray">
                      <p>Many users report seeing immediate improvements in skin hydration and luminosity after the first application. More significant results typically become visible within 2-3 weeks of consistent use. In clinical tests, the majority of participants showed measurable improvements in skin texture, firmness, and radiance after 15 days. For optimal anti-aging and skin-transforming effects, we recommend using the serums consistently for at least 8-12 weeks.</p>
                    </div>
                  )}
                </div>
                
                {/* FAQ Item 9 */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(8)} 
                    className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-neutral-50"
                  >
                    <span className="text-primary">Can I use both Samsara and Varuna serums together?</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-primary transition-transform ${openFaqIndex === 8 ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {openFaqIndex === 8 && (
                    <div className="px-6 py-4 bg-neutral-50 text-neutral-gray">
                      <p>Yes, the Samsara and Varuna serums are designed to complement each other as part of a comprehensive skincare ritual. For optimal results, apply the Samsara Miraculous Glow Booster first, as it targets radiance and uneven tone, followed by the Varuna Exceptional Repair Serum to address firmness and fine lines. This layering approach ensures you receive the full benefits of both formulations. Allow 30-60 seconds between applications for best absorption.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Spacer */}
      <div className="py-4"></div>
      
      {/* Product Grid */}
      <div className="container mx-auto px-4 py-12">
        {!category?.featuredProducts?.length && (
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <p className="text-neutral-gray mb-4 md:mb-0">{sortedProducts.length} products</p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price, low to high</SelectItem>
              <SelectItem value="price-high">Price, high to low</SelectItem>
              <SelectItem value="name-asc">Name, A-Z</SelectItem>
              <SelectItem value="name-desc">Name, Z-A</SelectItem>
              <SelectItem value="rating">Best Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map(product => (
            <ProductCard key={product._id!} product={product} showAddToCart />
          ))}
        </div>
      </div>
    </>
  );
}
