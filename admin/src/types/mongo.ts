import { Product, Category, Collection } from "@shared/schema";

// MongoDB adds _id in addition to our schema's id field
export interface MongoProduct extends Omit<Product, 'id'> {
  _id?: string;
  id?: number;
  // Link to collection
  collectionId?: string | number;
  weightGrams?: number | null;
  dimensionsCm?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  generalBenefits?: string;
  textSliderItems: Array<{
    text: string;
    duration: number;
  }>;
}

export interface MongoCategory extends Omit<Category, 'id'> {
  _id?: string;
  id?: number;
}

export interface MongoCollection extends Omit<Collection, 'id'> {
  _id?: string;
  id?: number;
} 