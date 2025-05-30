import mongoose, { Schema, Document } from "mongoose";

export interface IFreeProduct extends Document {
  productId: string;
  minOrderValue: number;
  maxOrderValue: number | null; // null means no upper limit
  enabled: boolean;
  createdAt: Date;
}

const FreeProductSchema: Schema = new Schema({
  productId: { type: String, required: true, unique: true },
  minOrderValue: { type: Number, required: true, min: 0 },
  maxOrderValue: { type: Number, default: null }, // null means no upper limit
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFreeProduct>("FreeProduct", FreeProductSchema);
