import { z } from "zod";

// FAQ schema type for products
export const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
export type FAQ = z.infer<typeof faqSchema>;

// Ingredients schema
export const ingredientSchema = z.object({
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  benefits: z.string().optional()
});
export type Ingredient = z.infer<typeof ingredientSchema>;

// How To Use schema
export const howToUseStepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  description: z.string(),
});
export type HowToUseStep = z.infer<typeof howToUseStepSchema>;

// Benefits schema
export const benefitSchema = z.object({
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().optional()
});
export type Benefit = z.infer<typeof benefitSchema>;

// Custom HTML Section schema
export const customHtmlSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  displayOrder: z.number().optional().default(0),
  enabled: z.boolean().default(false)
});
export type CustomHtmlSection = z.infer<typeof customHtmlSectionSchema>;

// Variant schemas
export const variantOptionSchema = z.object({
  label: z.string().min(1, "Option label is required"),
  url: z.string().min(1, "Option URL is required"),
  isDefault: z.boolean().optional().default(false)
});
export type VariantOption = z.infer<typeof variantOptionSchema>;
export const variantGroupSchema = z.object({
  heading: z.string().min(1, "Variant heading is required"),
  options: z.array(variantOptionSchema).default([])
});
export type VariantGroup = z.infer<typeof variantGroupSchema>;

// Product Zod schema and TypeScript type
export const productSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId as string
  sku: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  discountedPrice: z.number().optional().nullable(),
  imageUrl: z.string(),
  stock: z.number(),
  rating: z.number().optional(),
  totalReviews: z.number().optional(),
  slug: z.string(),
  categoryId: z.string().min(1, "Category is required"), // MongoDB ObjectId as string
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  images: z.array(z.string()).min(1, "At least one image is required").optional().default([]),
  videoUrl: z.string().optional(),
  faqs: z.array(
    z.object({
      question: z.string().min(1, "Question is required"),
      answer: z.string().min(1, "Answer is required"),
    })
  ).optional().default([]), // Product FAQs
  // Custom HTML sections
  customSections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      htmlContent: z.string(),
      displayOrder: z.number().default(0),
      enabled: z.boolean().default(true)
    })
  ).optional().default([]), // For custom HTML sections like "Clinically Tested To" 
  ingredients: z.string().optional(), // Simple text ingredients
  structuredIngredients: z.array(
    z.object({
      name: z.string().min(1, "Ingredient name is required"),
      description: z.string().min(1, "Description is required"),
      benefits: z.string().optional(),
      imageUrl: z.string().optional(),
    })
  ).optional().default([]), // Structured ingredients
  howToUse: z.string().optional(), // Simple text how-to-use
  howToUseVideo: z.string().optional(),
  howToUseSteps: z.array(
    z.object({
      stepNumber: z.number().min(1, "Step number is required"),
      title: z.string().min(1, "Step title is required"),
      description: z.string().min(1, "Step description is required"),
    })
  ).optional(), // Structured how-to-use steps
  // Video URL for how-to-use is defined above
  benefits: z.string().optional(), // Simple text benefits
  structuredBenefits: z.array(benefitSchema).optional().default([]), // Structured benefits
  customHtmlSections: z.array(customHtmlSectionSchema).optional().default([]), // Custom HTML sections
  variants: z.array(variantGroupSchema).optional().default([]), // Product variants
  minOrderValue: z.number().optional(), // For free products
  isFreeProduct: z.boolean().optional(), // Flag for free products
  usageFrequency: z.string().optional(), // Recommended usage frequency
});
export type Product = z.infer<typeof productSchema>;

// InsertProduct type omits id, _id, and createdAt for creation
export type InsertProduct = Omit<Product, 'id' | '_id' | 'createdAt'>;

// User types
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  isAdmin: boolean;
  createdAt: Date;
};
export type InsertUser = Omit<User, 'id' | '_id' | 'createdAt' | 'isAdmin'>;

// Order types
export type Order = {
  id?: string;
  userId: string;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  couponCode?: string | null;
  discountAmount?: number;
  packageLength?: number;
  packageBreadth?: number;
  packageHeight?: number;
  packageWeight?: number;
  createdAt: Date;
};
export type InsertOrder = Omit<Order, 'id' | '_id' | 'createdAt'>;

// OrderItem types
export type OrderItem = {
  id?: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
};
export type InsertOrderItem = Omit<OrderItem, 'id' | '_id'>;

// Review types
export type Review = {
  _id?: string;
  id?: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
  userName?: string;
};
export type InsertReview = Omit<Review, 'id' | '_id' | 'createdAt'>;

// Testimonial types
export type Testimonial = {
  id?: string;
  name: string;
  content: string;
  rating: number;
  featured: boolean;
  createdAt: Date;
};
export type InsertTestimonial = Omit<Testimonial, 'id' | '_id' | 'createdAt'>;

// Cart types
export type Cart = {
  id?: string;
  userId?: string;
  sessionId?: string;
  createdAt: Date;
};
export type InsertCart = Omit<Cart, 'id' | '_id' | 'createdAt'>;

// CartItem types
export type CartItem = {
  id?: string;
  cartId: string;
  productId: string;
  quantity: number;
  isFree: boolean;
};
export type InsertCartItem = Omit<CartItem, 'id' | '_id'>;

// Banner types
export type Banner = {
  id?: string;
  title: string;
  subtitle?: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  alt: string;
  linkUrl?: string;
  enabled: boolean;
  position: number;
};
export type InsertBanner = Omit<Banner, 'id' | '_id'>;

// FeaturedProductVariant schema
export const featuredProductVariantSchema = z.object({
  size: z.string(),
  price: z.number(),
  isDefault: z.boolean()
});
export type FeaturedProductVariant = z.infer<typeof featuredProductVariantSchema>;

// FeaturedProductStat schema
export const featuredProductStatSchema = z.object({
  percent: z.number(),
  text: z.string()
});
export type FeaturedProductStat = z.infer<typeof featuredProductStatSchema>;

// FeaturedProduct schema
export const featuredProductSchema = z.object({
  productId: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  position: z.number(),
  layout: z.enum(['image-right', 'image-left']),
  variants: z.array(featuredProductVariantSchema),
  benefits: z.array(z.string()),
  stats: z.array(featuredProductStatSchema),
  _id: z.string().optional()
});
export type FeaturedProduct = z.infer<typeof featuredProductSchema>;

// Category Zod schema and TypeScript type
export const categorySchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  slug: z.string(),
  imageUrl: z.string().optional(),
  desktopImageUrl: z.string().url().optional(),
  mobileImageUrl: z.string().url().optional(),
  featured: z.boolean().optional(),
  featuredProducts: z.array(featuredProductSchema).optional()
});
export type Category = z.infer<typeof categorySchema>;

// InsertCategory type for creating categories
export type InsertCategory = Omit<Category, 'id' | '_id'>;

// Collection Zod schema and TypeScript type
export const collectionSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  slug: z.string(),
  imageUrl: z.string().optional(),
  desktopImageUrl: z.string().optional(),
  mobileImageUrl: z.string().optional(),
  featured: z.boolean().optional(),
});
export type Collection = z.infer<typeof collectionSchema>;
export type InsertCollection = Omit<Collection, 'id' | '_id'>;

// ProductCollection join Zod schema and TypeScript type
export const productCollectionSchema = z.object({
  _id: z.string().optional(),
  productId: z.string(),
  collectionId: z.string(),
});
export type ProductCollection = z.infer<typeof productCollectionSchema>;

// InsertProductCollection type for creating product-collection mappings
export type InsertProductCollection = Omit<ProductCollection, 'id' | '_id'>;

// Scanner types
export type Scanner = {
  id?: string;
  data: string;
  productId?: string;
  scannedAt: Date;
};
export type InsertScanner = Omit<Scanner, 'id' | 'scannedAt'>;

// FreeProduct types
export type FreeProduct = {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  enabled: boolean;
  minOrderValue: number;
  maxOrderValue?: number;
  createdAt: Date;
};
export type InsertFreeProduct = Omit<FreeProduct, 'id' | '_id' | 'createdAt'>;
