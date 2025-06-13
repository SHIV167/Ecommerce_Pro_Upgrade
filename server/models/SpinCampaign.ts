import mongoose, { Schema, Document } from 'mongoose';

// Prize subdocument interface
export interface IPrize {
  title: string;
  description?: string;
  imageUrl?: string;
  weight: number;
  prizeType: 'coupon' | 'product' | 'credit';
  payload: string | number;
  quantity: number; // -1 for unlimited
}

export interface ISpinCampaign extends Document {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  maxSpinsPerUser: number;
  prizes: IPrize[];
  createdAt: Date;
  updatedAt: Date;
}

const PrizeSchema = new Schema<IPrize>({
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  weight: { type: Number, required: true, min: 0 },
  prizeType: { type: String, enum: ['coupon', 'product', 'credit'], required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  quantity: { type: Number, default: -1 },
});

const SpinCampaignSchema = new Schema<ISpinCampaign>(
  {
    name: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    maxSpinsPerUser: { type: Number, default: 1 },
    prizes: { type: [PrizeSchema], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISpinCampaign>('SpinCampaign', SpinCampaignSchema);
