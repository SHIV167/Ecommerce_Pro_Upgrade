import mongoose, { Schema, Document } from 'mongoose';

// Ensure mongoose is properly initialized before creating models
let GiftPopupModel: mongoose.Model<IGiftPopup>;

export interface IGiftPopup extends Document {
  title: string;
  subTitle: string;
  active: boolean;
  minCartValue: number;
  maxCartValue: number | null;
  maxSelectableGifts: number;
  giftProducts: string[]; // Array of product IDs to offer as gifts
  createdAt: Date;
  updatedAt: Date;
}

const GiftPopupSchema: Schema = new Schema({
  title: { type: String, required: true },
  subTitle: { type: String, default: '' },
  active: { type: Boolean, default: true },
  minCartValue: { type: Number, required: true, min: 0 },
  maxCartValue: { type: Number, default: null },
  maxSelectableGifts: { type: Number, required: true, default: 2, min: 1 },
  giftProducts: [{ type: String, required: true }], // Array of product IDs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

GiftPopupSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

// Only create the model if it doesn't already exist (preventing model overwrite errors)
try {
  GiftPopupModel = mongoose.model<IGiftPopup>('GiftPopup');
} catch (error) {
  GiftPopupModel = mongoose.model<IGiftPopup>('GiftPopup', GiftPopupSchema);
}

export default GiftPopupModel;
