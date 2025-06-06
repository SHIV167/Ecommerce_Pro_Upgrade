import { Request, Response } from 'express';
import OrderModel from '../models/Order';
import OrderItemModel from '../models/OrderItem';
import { createShipment } from '../utils/shiprocket';

export async function getOrders(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    if (userId) {
      const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
      return res.json(orders);
    }
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const dateFilter = (req.query.date as string) || '';

    const filter: any = {};
    if (search) {
      filter.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (dateFilter && dateFilter !== 'all') {
      const date = new Date(dateFilter);
      if (!isNaN(date.getTime())) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        filter.createdAt = { $gte: start, $lte: end };
      }
    }

    const total = await OrderModel.countDocuments(filter);
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ orders, total });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
}

export async function updateOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, packageLength, packageBreadth, packageHeight, packageWeight } = req.body;
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (packageLength !== undefined) updateData.packageLength = packageLength;
    if (packageBreadth !== undefined) updateData.packageBreadth = packageBreadth;
    if (packageHeight !== undefined) updateData.packageHeight = packageHeight;
    if (packageWeight !== undefined) updateData.packageWeight = packageWeight;

    let updatedOrder: any = await OrderModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // Create shipment when marking as shipped
    if (status === 'shipped') {
      try {
        const items = await OrderItemModel.find({ orderId: id }).lean();
        const shipmentResp = await createShipment(updatedOrder, items);
        if (shipmentResp.order_id) {
          await OrderModel.findByIdAndUpdate(id, { shiprocketOrderId: shipmentResp.order_id });
          updatedOrder.shiprocketOrderId = shipmentResp.order_id;
        }
      } catch (err) {
        console.error('Error creating shipment:', err);
      }
    }
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order' });
  }
}

// Create a new order with items
export async function createOrder(req: Request, res: Response) {
  try {
    const { order, items } = req.body;
    const createdOrder = await OrderModel.create(order);
    // Use Mongoose Document.id (string) to avoid unknown _id type
    const orderId = createdOrder.id;
    // Insert order items
    await Promise.all(items.map((item: any) => OrderItemModel.create({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })));
    return res.json({ order: { id: orderId }, items });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Error creating order', error: error.message });
  }
}

// Fetch a single order by ID (with its items)
export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const items = await OrderItemModel.find({ orderId: id }).lean();
    return res.json({ order, items });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ message: 'Error fetching order' });
  }
}
