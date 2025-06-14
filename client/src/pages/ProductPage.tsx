import { useState, useEffect } from "react";
import React from "react";
import { useLocation, RouteComponentProps, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product as BaseProduct, Review, Ingredient } from "@shared/schema";
import { Product, FAQ } from "@/types/product";
import ReviewForm from "@/components/product/ReviewForm";
import AnimatedCartButton from "@/components/ui/AnimatedCartButton";
import RatingStars from "@/components/products/RatingStars";
import ProductCollection from "@/components/home/ProductCollection";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet";
import BannerLoader from "@/components/ui/BannerLoader";
import StickyAddToCart from "@/components/products/StickyAddToCart";
import { apiRequest } from "@/lib/queryClient";
import SocialShare from "@/components/products/SocialShare";
import ProductFAQ from "@/components/product/ProductFAQ";
import '@/styles/product-faq.css';
import BlogSection from '@/components/home/BlogSection';
import BestOffers from '@/components/product/BestOffers';
import { VALID_PINCODES, DELIVERY_ESTIMATION_DAYS } from '@/lib/settings';
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import '@/styles/custom-html-sections.css';

// Extend Review type with server-enriched fields
type EnrichedReview = Review & { _id?: string; userName?: string };

// Type for custom HTML sections
type CustomHtmlSection = {
  id: string;
  title: string;
  content: string;
  displayOrder: number;
  enabled: boolean;
};

const ProductPage = ({ params }: RouteComponentProps<{ slug: string }>) => {
  const { slug: rawSlug } = params;
  const slug = rawSlug.endsWith('.html') ? rawSlug.slice(0, -5) : rawSlug;
  const [location, navigate] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeAvailability, setPincodeAvailability] = useState<{ available: boolean; message: string; deliveryDays?: number } | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [scannerEntry, setScannerEntry] = useState<any | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);


  const { data: product, isLoading: productLoading } = useQuery<BaseProduct & { faqs?: FAQ[] }>({
    queryKey: [`/api/products/${slug}`],
    queryFn: () => fetch(`/api/products/${slug}`).then(res => res.json()),
    enabled: !!slug,
  });

  const { data: reviews = [] } = useQuery<EnrichedReview[]>({
    queryKey: [`/api/products/${product?._id}/reviews`],
    queryFn: () => fetch(`/api/products/${product?._id}/reviews`).then(res => res.json()),
    enabled: !!product?._id,
  });

  const { data: bestsellers = [] } = useQuery<Product[]>({
    queryKey: ['bestsellersProducts'],
    queryFn: () => fetch('/api/products/bestsellers').then(res => res.json()),
    enabled: true,
  });

  const isDataReady = !productLoading && !!product;
  const extendedProduct = isDataReady ? {
    ...product,
    reviews,
    relatedProducts: ((product as any)?.relatedProducts || []) as Product[],
    faqs: product?.faqs || [],
    customHtmlSections: ((product as any)?.customHtmlSections || []) as CustomHtmlSection[]
  } : null;

  const ExtendedReviewForm = ReviewForm as unknown as React.FC<{ productId: string; onClose: () => void; onSubmit: (review: EnrichedReview) => void; }>;

  useEffect(() => {
    async function fetchPromoTimers() {
      const res = await fetch("/api/promotimers");
      const timers = await res.json();
      (window as any).PROMO_TIMERS = timers;
    }
    fetchPromoTimers();
  }, []);

  useEffect(() => {
    if (product?._id) {
      apiRequest("POST", "/api/scanners", {
        data: window.location.href,
        productId: product._id,
        scannedAt: new Date().toISOString()
      })
        .then(res => res.json())
        .then(entry => {
          setScannerEntry(entry);
          if (entry?.couponCode && !couponApplied) {
            toast({ title: "Coupon Applied" });
            setCouponApplied(true);
          }
        })
        .catch(err => console.error("Log scan error", err));
    }
  }, [product?._id, toast, couponApplied]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!extendedProduct) return;
    try {
      await addItem(extendedProduct!, quantity);
      toast({ title: `${quantity} item${quantity > 1 ? 's' : ''} added to cart` });
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast({ title: "Error adding to cart", description: error.message });
    }
  };

  const handleBuyNow = () => {
    if (!extendedProduct) return;
    addItem(extendedProduct!, quantity);
    navigate('/checkout');
  };

  useEffect(() => {
    if (product?.images && product.images.length > 1) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const timer = setInterval(() => {
          setSelectedImageIndex(prev => (prev + 1) % product.images.length);
        }, 3000);
        return () => clearInterval(timer);
      }
    }
  }, [product?.images]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX - touchEndX > 50 && product?.images) {
      setSelectedImageIndex(prev => (prev + 1) % product.images.length);
    }
    if (touchEndX - touchStartX > 50 && product?.images) {
      setSelectedImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const checkPincodeAvailability = () => {
    if (!pincode || pincode.trim() === "") {
      toast({ title: "Please enter a pincode", variant: "destructive" });
      return;
    }

    if (VALID_PINCODES.includes(pincode.trim())) {
      const isFastDeliveryPincode = pincode.startsWith("400");
      const deliveryDays = isFastDeliveryPincode
        ? DELIVERY_ESTIMATION_DAYS.FAST_DAYS
        : DELIVERY_ESTIMATION_DAYS.STANDARD_DAYS;

      setPincodeAvailability({
        available: true,
        message: "Delivery available in your area!",
        deliveryDays
      });
    } else {
      setPincodeAvailability({
        available: false,
        message: "Sorry, we don't deliver to this pincode yet."
      });
    }
  };

  const renderCustomHtmlSections = () => {
    const customSections = extendedProduct?.customHtmlSections || (product as any)?.customHtmlSections || [];
    if (!customSections || customSections.length === 0) {
      return null;
    }
    const activeSections = customSections
      .filter(section => section.enabled)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    if (activeSections.length === 0) {
      return null;
    }
    return activeSections.map(section => (
      <div
        key={section.id}
        className="mt-8 bg-white border p-4 rounded-lg custom-html-section"
      >
        <h3 className="text-xl font-bold mb-4">{section.title}</h3>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/uploads/fullbg_Desktop.png')", backgroundSize: "cover" }}>
      {!isDataReady ? (
        <BannerLoader />
      ) : (
        <>
          <Helmet>
            <title>{extendedProduct!.name} | Shiv Ayurveda</title>
            <meta name="description" content={extendedProduct!.shortDescription || extendedProduct!.description?.substring(0, 160) || ""} />
            <meta property="og:title" content={extendedProduct!.name} />
            <meta property="og:description" content={extendedProduct!.shortDescription || extendedProduct!.description?.substring(0, 160) || ""} />
            <meta property="og:image" content={extendedProduct!.images?.[0] || extendedProduct!.imageUrl} />
            <meta property="og:url" content={window.location.href} />
            <meta name="twitter:card" content="summary_large_image" />
          </Helmet>

          <Lightbox
            open={isLightboxOpen}
            close={() => setIsLightboxOpen(false)}
            slides={
              extendedProduct?.images?.map((image) => ({ src: image })) || []
            }
            index={selectedImageIndex}
            plugins={[Thumbnails]}
            on={{
              view: ({ index: currentIndex }) => setSelectedImageIndex(currentIndex),
            }}
          />

          {scannerEntry?.couponCode && (
            <div className="bg-primary/10 text-primary p-4 text-center">
              <div className="container mx-auto">
                <p className="text-xl font-semibold">Special Offer!</p>
                <p>Use code <span className="font-bold">{scannerEntry.couponCode}</span> at checkout for extra savings.</p>
              </div>
            </div>
          )}

          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Image Gallery Section */}
              <div className="w-full md:w-1/2">
                <div className="border border-neutral-sand p-2 sm:p-4 md:p-6 rounded-md overflow-hidden">
                  <div className="relative w-full flex flex-col">
                    {/* Main Image Display */}
                    <div
                      className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg shadow-lg mb-4 cursor-pointer group"
                      onClick={() => {
                        if (extendedProduct!.images && extendedProduct!.images.length > 0) {
                          setIsLightboxOpen(true);
                        }
                      }}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {extendedProduct!.images && extendedProduct!.images.length > 0 ? (
                        extendedProduct!.images.map((image, index) => (
                          <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === selectedImageIndex ? 'opacity-100' : 'opacity-0'}`}
                          >
                            <img
                              src={image}
                              alt={`${extendedProduct!.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))
                      ) : (
                        <img
                          src={extendedProduct!.imageUrl}
                          alt={extendedProduct!.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {extendedProduct!.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageIndex(index);
                            }}
                            className={`w-3 h-3 rounded-full ${index === selectedImageIndex ? 'bg-primary' : 'bg-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Thumbnails */}
                    <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
                      {extendedProduct!.images.map((image, index) => (
                        <div
                          key={index}
                          className={`w-24 h-24 flex-shrink-0 cursor-pointer border-2 rounded-md ${selectedImageIndex === index ? 'border-primary' : 'border-transparent'}`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details Section */}
              <div className="w-full md:w-1/2">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{extendedProduct!.name}</h1>
                <p className="text-gray-700 mb-4">{extendedProduct!.description}</p>
                <div className="flex items-center mb-4">
                  <RatingStars rating={extendedProduct!.rating || 0} />
                  <span className="ml-2 text-gray-600">({extendedProduct!.reviews?.length || 0} reviews)</span>
                </div>
                {extendedProduct!.variants?.map((variant) => (
                  <div key={variant.heading} className="mb-6">
                    <h3 className="text-lg font-medium mb-2">{variant.heading}</h3>
                    <div className="flex gap-2 mb-4">
                      {variant.options.map((option: { label: string; url: string; isDefault?: boolean }) => {
                        const isSelected = location === option.url;
                        let btnClass = 'bg-white text-gray-800';
                        if (isSelected) btnClass = 'bg-primary text-white';
                        else if (option.isDefault) btnClass = 'bg-primary text-white font-bold';
                        return (
                          <Link key={option.url} href={option.url}>
                            <button className={`px-4 py-2 border rounded ${btnClass}`}>
                              {option.label}
                            </button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="font-heading text-2xl text-primary">
                      {extendedProduct!.discountedPrice
                        ? `₹${extendedProduct!.discountedPrice.toFixed(2)}`
                        : `₹${extendedProduct!.price.toFixed(2)}`}
                    </p>
                    {extendedProduct!.discountedPrice && (
                      <>
                        <span className="text-lg text-neutral-gray line-through">
                          ₹{extendedProduct!.price.toFixed(2)}
                        </span>
                        <span className="text-green-600 font-medium">
                          {Math.round(((extendedProduct!.price - extendedProduct!.discountedPrice) / extendedProduct!.price) * 100)}% off
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">(Included all taxes)</div>
                  <p className="text-sm">
                    {extendedProduct!.stock > 0 ? (
                      <span className="text-green-600">In Stock</span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </p>
                </div>
                {/* Quantity Controls */}
                <div className="flex items-center space-x-2 mt-4">
                  <span className="font-medium">Quantity:</span>
                  <button
                    onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                    className="px-3 py-1 bg-gray-100 rounded border focus:outline-none"
                  >
                    –
                  </button>
                  <span className="text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-1 bg-gray-100 rounded border focus:outline-none"
                  >
                    +
                  </button>
                </div>
                {/* Action Buttons */}
                <div className="flex space-x-4 mt-4">
                  {extendedProduct!.stock === 0 ? (
                    <AnimatedCartButton disabled className="w-80 py-6 bg-gray-500 cursor-not-allowed" variant="primary">
                      Out of Stock
                    </AnimatedCartButton>
                  ) : (
                    <>
                      <AnimatedCartButton
                        className="w-80 py-6 bg-amber-500 hover:bg-amber-600"
                        onClick={handleAddToCart}
                        variant="primary"
                      >
                        Add To Cart
                      </AnimatedCartButton>
                      <AnimatedCartButton
                        className="w-80 py-6 bg-black hover:bg-neutral-900"
                        onClick={handleBuyNow}
                        variant="primary"
                      >
                        Buy Now
                      </AnimatedCartButton>
                    </>
                  )}
                </div>
                <SocialShare url={window.location.href} title={extendedProduct!.name} />
                <div className="mt-6">
                  <BestOffers />
                </div>
              </div>
            </div>

            {/* Product Information Sections */}
            <div className="mt-12 max-w-5xl mx-auto p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Offers Section */}
                <div className="w-full md:w-1/2 border rounded p-4 mb-6 bg-white">
                  <h2 className="text-xl font-heading text-center mb-4">Offers</h2>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <span className="text-gray-400 mr-2 w-6 text-center"><img src="/uploads/minicart-offer.svg" alt="offer icon" className="w-4 h-4" /></span>
                      <span className="text-sm">Choose any 1 complimentary gift worth upto Rs.2298 on orders above Rs.4000</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-gray-400 mr-2 w-6 text-center"><img src="/uploads/minicart-offer.svg" alt="offer icon" className="w-4 h-4" /></span>
                      <span className="text-sm">Choose any 2 complimentary gifts worth upto Rs.3998 on orders above Rs.6000</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-gray-400 mr-2 w-6 text-center"><img src="/uploads/minicart-offer.svg" alt="offer icon" className="w-4 h-4" /></span>
                      <span className="text-sm">Add Complementary NEW Premium Sample on every order!</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-gray-400 mr-2 w-6 text-center"><img src="/uploads/minicart-offer.svg" alt="offer icon" className="w-4 h-4" /></span>
                      <span className="text-sm">10% off on first order above Rs.1500 (Use Code: KAMA10)</span>
                    </li>
                  </ul>
                </div>

                {/* Pincode Checker Section */}
                <div className="w-full md:w-1/2 border rounded p-4 mb-6 bg-white">
                  <h2 className="text-xl font-heading text-center mb-4">Check Delivery</h2>
                  <div className="flex">
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Enter Pincode"
                      className="flex-grow p-2 border rounded-l-md"
                    />
                    <button onClick={checkPincodeAvailability} className="bg-primary text-white px-4 rounded-r-md">Check</button>
                  </div>
                  {pincodeAvailability && (
                    <div className={`mt-2 text-sm ${pincodeAvailability.available ? 'text-green-600' : 'text-red-600'}`}>
                      {pincodeAvailability.message}
                      {pincodeAvailability.available && pincodeAvailability.deliveryDays && (
                        <p>Estimated delivery in {pincodeAvailability.deliveryDays} days.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {renderCustomHtmlSections()}
            </div>

            {/* Product Tabs */}
            <section className="mt-12">
              {/* Tabs could be implemented here */}
            </section>

            {/* Reviews Section */}
            <section className="mt-12 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">Customer Reviews</h2>
              <div className="text-center mb-6">
                {isAuthenticated ? (
                  <AnimatedCartButton
                    variant="secondary"
                    onClick={() => setIsReviewFormOpen(true)}
                    className="text-sm border border-neutral-sand hover:bg-neutral-cream"
                  >
                    Write a Review
                  </AnimatedCartButton>
                ) : (
                  <AnimatedCartButton
                    variant="secondary"
                    onClick={() => navigate('/login')}
                    className="text-sm border border-neutral-sand hover:bg-neutral-cream"
                  >
                    Write a Review
                  </AnimatedCartButton>
                )}
              </div>
              {isReviewFormOpen && (
                <ExtendedReviewForm
                  productId={extendedProduct!._id || ""}
                  onClose={() => setIsReviewFormOpen(false)}
                  onSubmit={(review: EnrichedReview) => {
                    toast({ title: "Review submitted", description: "Your review has been saved successfully!" });
                    console.log("Review submitted:", review);
                    setIsReviewFormOpen(false);
                  }}
                />
              )}
              <div className="space-y-6">
                {extendedProduct!.reviews && extendedProduct!.reviews.length > 0 ? (
                  extendedProduct!.reviews.map((review: EnrichedReview) => (
                    <div key={review._id} className="bg-white p-4 rounded border border-gray-100">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <h3 className="font-bold mr-2">{review.userName || 'Anonymous'}</h3>
                          <RatingStars rating={review.rating || 0} />
                        </div>
                        <p className="mt-2 text-gray-700 whitespace-normal break-words">{review.comment || 'No comment provided.'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No reviews available</p>
                )}
              </div>
            </section>

            {/* Bestsellers */}
            <section className="py-8">
              <div className="container mx-auto px-4 py-6 rounded">
                <ProductCollection title="You May Also Like" collectionSlug="bestsellers" slider={true} />
              </div>
            </section>

            {/* Blog Section */}
            <BlogSection />

            <StickyAddToCart product={extendedProduct!} quantity={quantity} setQuantity={setQuantity} onAddToCart={handleAddToCart} />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductPage;