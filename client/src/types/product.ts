export interface FAQ {
  question: string;
  answer: string;
}

export interface HowToUseStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  discountedPrice?: number | null;
  stock: number;
  imageUrl?: string;
  videoUrl?: string;
  faqs?: FAQ[];
  howToUse?: string;
  howToUseVideo?: string;
  howToUseSteps?: HowToUseStep[];
  structuredIngredients?: any[];
  [key: string]: any;
}
