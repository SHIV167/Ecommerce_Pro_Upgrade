import mongoose, { Document, Schema } from 'mongoose';

export interface ISetting extends Document {
  siteName: string;
  maintenanceMode: boolean;
  supportEmail: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  shiprocketApiKey: string;
  shiprocketApiSecret: string;
  shiprocketSourcePincode: string;
  shiprocketPickupLocation: string;
  shiprocketChannelId: number;
  taxEnabled: boolean;
  taxPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    siteName: { type: String, required: true },
    maintenanceMode: { type: Boolean, required: true, default: false },
    supportEmail: { type: String, required: true },
    razorpayKeyId: { type: String, required: true },
    razorpayKeySecret: { type: String, required: true },
    shiprocketApiKey: { type: String, required: true },
    shiprocketApiSecret: { type: String, required: true },
    shiprocketSourcePincode: { type: String, required: true },
    shiprocketPickupLocation: { type: String, required: true },
    shiprocketChannelId: { type: Number, required: true },
    taxEnabled: { type: Boolean, required: true, default: false },
    taxPercentage: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ISetting>('Setting', SettingSchema);
