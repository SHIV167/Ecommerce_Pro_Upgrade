import mongoose, { Schema, Document } from 'mongoose';

export interface IPromoMessage extends Document {
  minCartValue: number;
  maxCartValue: number;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const PromoMessageSchema = new Schema<IPromoMessage>(
  {
    minCartValue: { type: Number, required: true },
    maxCartValue: { type: Number, required: true },
    message:      { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPromoMessage>('PromoMessage', PromoMessageSchema);
