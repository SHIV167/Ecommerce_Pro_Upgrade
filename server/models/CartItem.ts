import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICartItem extends Document {
  cartId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  isFree: boolean;
}

const CartItemSchema: Schema = new Schema({
  cartId: { type: Schema.Types.ObjectId, required: true, ref: 'Cart' },
  productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  quantity: { type: Number, required: true, min: 1 },
  isFree: { type: Boolean, required: true, default: false }
});

// Ensure unique per cartId/productId/isFree
CartItemSchema.index({ cartId: 1, productId: 1, isFree: 1 }, { unique: true });

export default mongoose.model<ICartItem>('CartItem', CartItemSchema);