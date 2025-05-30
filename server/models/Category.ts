import mongoose, { Schema, Document } from 'mongoose';

export interface IFeaturedProductVariant {
  size: string;
  price: number;
  isDefault: boolean;
  imageUrl?: string;
}

export interface IFeaturedProduct {
  productId: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  position: number; // 1, 2, 3, 4 for the different sections
  layout: 'image-right' | 'image-left';
  variants: IFeaturedProductVariant[];
  benefits: string[];
  stats: {
    percent: number;
    text: string;
  }[];
}

export interface ICategory extends Document {
  name: string;
  description?: string;
  slug: string;
  imageUrl?: string;
  featured: boolean;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  featuredProducts?: IFeaturedProduct[];
}

const FeaturedProductVariantSchema = new Schema({
  size: { type: String, required: true },
  price: { type: Number, required: true },
  isDefault: { type: Boolean, default: false },
  imageUrl: { type: String }
}, { _id: false });

const StatSchema = new Schema({
  percent: { type: Number, required: true },
  text: { type: String, required: true }
}, { _id: false });

const FeaturedProductSchema = new Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  imageUrl: { type: String },
  position: { type: Number, required: true },
  layout: { type: String, enum: ['image-right', 'image-left'], default: 'image-right' },
  variants: [FeaturedProductVariantSchema],
  benefits: [{ type: String }],
  stats: [StatSchema]
}, { _id: false });

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  slug: { type: String, required: true, unique: true },
  imageUrl: { type: String },
  featured: { type: Boolean, default: false },
  desktopImageUrl: { type: String },
  mobileImageUrl: { type: String },
  featuredProducts: [FeaturedProductSchema]
});

export default mongoose.model<ICategory>('Category', CategorySchema);