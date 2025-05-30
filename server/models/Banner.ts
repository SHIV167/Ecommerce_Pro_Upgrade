import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  id: string;
  title: string;
  subtitle?: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  linkUrl?: string;
  alt: string;

  enabled: boolean;
  position: number;
}

const BannerSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  desktopImageUrl: { type: String, required: true },
  mobileImageUrl: { type: String, required: true },
  linkUrl: { type: String },
  alt: { type: String, required: true },

  enabled: { type: Boolean, default: true },
  position: { type: Number, default: 0 }
});

// FORCE CLOUDINARY URLS - This is a pre-save hook that will run before any banner is saved to the database
// It will block any non-Cloudinary URLs from being saved
BannerSchema.pre('save', function(next) {
  // Use proper typing for mongoose document
  const banner = this as unknown as {
    desktopImageUrl?: string;
    mobileImageUrl?: string;
  };
  
  // Strictly enforce Cloudinary URLs only
  if (banner.desktopImageUrl && !banner.desktopImageUrl.includes('cloudinary.com')) {
    console.error(`[BANNER MODEL] ERROR: Non-Cloudinary URL detected: ${banner.desktopImageUrl}`);
    return next(new Error(`Desktop image URL must be a Cloudinary URL. Got: ${banner.desktopImageUrl}`));
  }
  
  if (banner.mobileImageUrl && !banner.mobileImageUrl.includes('cloudinary.com')) {
    console.error(`[BANNER MODEL] ERROR: Non-Cloudinary URL detected: ${banner.mobileImageUrl}`);
    return next(new Error(`Mobile image URL must be a Cloudinary URL. Got: ${banner.mobileImageUrl}`));
  }
  
  next();
});

// Block any updates with non-Cloudinary URLs
BannerSchema.pre<mongoose.Query<any, any>>('findOneAndUpdate', function(next) {
  try {
    const update = this.getUpdate();
    
    // Skip if no update object
    if (!update || typeof update !== 'object') {
      return next();
    }
    
    // Handle the update using the 'any' type
    const anyUpdate = update as any;
    
    // Check for direct updates - block non-Cloudinary URLs
    if (anyUpdate.desktopImageUrl && !String(anyUpdate.desktopImageUrl).includes('cloudinary.com')) {
      console.error(`[BANNER MODEL] ERROR: Non-Cloudinary URL in update: ${anyUpdate.desktopImageUrl}`);
      return next(new Error(`Desktop image URL must be a Cloudinary URL. Got: ${anyUpdate.desktopImageUrl}`));
    }
    
    if (anyUpdate.mobileImageUrl && !String(anyUpdate.mobileImageUrl).includes('cloudinary.com')) {
      console.error(`[BANNER MODEL] ERROR: Non-Cloudinary URL in update: ${anyUpdate.mobileImageUrl}`);
      return next(new Error(`Mobile image URL must be a Cloudinary URL. Got: ${anyUpdate.mobileImageUrl}`));
    }
    
    // Check for $set updates - block non-Cloudinary URLs
    if (anyUpdate.$set) {
      if (anyUpdate.$set.desktopImageUrl && !String(anyUpdate.$set.desktopImageUrl).includes('cloudinary.com')) {
        console.error(`[BANNER MODEL] ERROR: Non-Cloudinary URL in $set: ${anyUpdate.$set.desktopImageUrl}`);
        return next(new Error(`Desktop image URL must be a Cloudinary URL. Got: ${anyUpdate.$set.desktopImageUrl}`));
      }
      
      if (anyUpdate.$set.mobileImageUrl && !String(anyUpdate.$set.mobileImageUrl).includes('cloudinary.com')) {
        console.error(`[BANNER MODEL] ERROR: Non-Cloudinary URL in $set: ${anyUpdate.$set.mobileImageUrl}`);
        return next(new Error(`Mobile image URL must be a Cloudinary URL. Got: ${anyUpdate.$set.mobileImageUrl}`));
      }
    }
  } catch (error) {
    console.error('[BANNER MODEL] Error in update hook:', error);
  }
  
  next();
});

// Create the model with strictly enforced Cloudinary URLs
const BannerModel = mongoose.model<IBanner>('Banner', BannerSchema);

console.log('[BANNER MODEL] Cloudinary URL enforcement activated for all banner operations');

export default BannerModel;