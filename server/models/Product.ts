import mongoose, { Schema, Document } from 'mongoose';

export interface FAQ {
  question: string;
  answer: string;
}

export interface Ingredient {
  name: string;
  description: string;
  benefits?: string;
  imageUrl?: string;
}

export interface HowToUseStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface Benefit {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface TextSliderItem {
  text: string;
  duration: number;
}

export interface CustomHtmlSection {
  id: string;
  title: string;
  content: string;
  displayOrder?: number;
  enabled: boolean;
}

export interface VariantOption {
  label: string;
  url: string;
  isDefault?: boolean;
}

export interface VariantGroup {
  heading: string;
  options: VariantOption[];
}

export interface IProduct extends Document {
  name: string;
  sku: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountedPrice?: number;
  imageUrl: string;
  stock: number;
  rating?: number;
  totalReviews?: number;
  slug: string;
  categoryId: string;
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  createdAt: Date;
  images: string[];
  videoUrl: string;
  faqs?: FAQ[];
  ingredients?: string;
  structuredIngredients?: Ingredient[];
  howToUse?: string;
  howToUseVideo?: string;
  howToUseSteps?: HowToUseStep[];
  benefits?: string;
  structuredBenefits?: Benefit[];
  customHtmlSections?: CustomHtmlSection[];
  variants?: VariantGroup[];
  textSliderItems?: TextSliderItem[];
}

const FAQSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const IngredientSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  benefits: { type: String },
  imageUrl: { type: String }
}, { _id: false });

const HowToUseStepSchema = new Schema({
  stepNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false });

const BenefitSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String }
}, { _id: false });

const CustomHtmlSectionSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  enabled: { type: Boolean, default: false }
}, { _id: false });

const VariantOptionSchema = new Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const VariantGroupSchema = new Schema({
  heading: { type: String, required: true },
  options: { type: [VariantOptionSchema], default: [] }
}, { _id: false });

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  price: { type: Number, required: true },
  discountedPrice: { type: Number },
  imageUrl: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  slug: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true },
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  images: { type: [String], default: [] },
  videoUrl: { type: String, default: '' },
  faqs: { type: [FAQSchema], default: [] },
  ingredients: { type: String },
  structuredIngredients: { type: [IngredientSchema], default: [] },
  howToUse: { type: String },
  howToUseVideo: { type: String },
  howToUseSteps: { type: [HowToUseStepSchema], default: [] },
  benefits: { type: String },
  structuredBenefits: { type: [BenefitSchema], default: [] },
  variants: { type: [VariantGroupSchema], default: [] },
  customHtmlSections: { type: [CustomHtmlSectionSchema], default: [] },
  textSliderItems: [{
    text: { type: String, required: true },
    duration: { type: Number, required: true, default: 3 }
  }]
});

export default mongoose.model<IProduct>('Product', ProductSchema);