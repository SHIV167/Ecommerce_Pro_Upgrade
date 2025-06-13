import mongoose, { Schema, Document, Types } from 'mongoose';
import { IPrize } from './SpinCampaign';

export interface ISpinHistory extends Document {
  userId: string;
  campaignId: Types.ObjectId;
  prize: IPrize;
  spinDate: Date;
}

const SpinHistorySchema = new Schema<ISpinHistory>(
  {
    userId: { type: String, required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'SpinCampaign', required: true } as any,
    prize: { type: Schema.Types.Mixed, required: true },
    spinDate: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

export default mongoose.model<ISpinHistory>('SpinHistory', SpinHistorySchema);
