import { Request, Response } from 'express';
import PromoMessage from '../models/PromoMessage';

export const getPromoMessages = async (req: Request, res: Response) => {
  const cartTotal = parseFloat(req.query.cartTotal as string);
  const filter = isNaN(cartTotal)
    ? {}
    : { minCartValue: { $lte: cartTotal }, maxCartValue: { $gte: cartTotal } };
  const msgs = await PromoMessage.find(filter).sort({ minCartValue: -1 });
  res.json(msgs);
};

export const getPromoMessage = async (req: Request, res: Response) => {
  const msg = await PromoMessage.findById(req.params.id);
  if (!msg) return res.sendStatus(404);
  res.json(msg);
};

export const createPromoMessage = async (req: Request, res: Response) => {
  const msg = new PromoMessage(req.body);
  await msg.save();
  res.status(201).json(msg);
};

export const updatePromoMessage = async (req: Request, res: Response) => {
  const msg = await PromoMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!msg) return res.sendStatus(404);
  res.json(msg);
};

export const deletePromoMessage = async (req: Request, res: Response) => {
  await PromoMessage.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};
