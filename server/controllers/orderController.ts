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
    const orderDoc = await OrderModel.findById(id).lean();
    if (!orderDoc) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // Populate missing shipping fields from billing if empty, and vice versa
    if (!orderDoc.shippingAddress) {
      orderDoc.shippingAddress = orderDoc.billingAddress || '';
      orderDoc.shippingCity = orderDoc.billingCity;
      orderDoc.shippingState = orderDoc.billingState;
      orderDoc.shippingPincode = orderDoc.billingPincode;
      orderDoc.shippingCountry = orderDoc.billingCountry;
    }
    if (!orderDoc.billingAddress) {
      orderDoc.billingAddress = orderDoc.shippingAddress;
      orderDoc.billingCity = orderDoc.shippingCity;
      orderDoc.billingState = orderDoc.shippingState;
      orderDoc.billingPincode = orderDoc.shippingPincode;
      orderDoc.billingCountry = orderDoc.shippingCountry;
    }
    // Fetch user details if userId exists to populate email and phone
    let user: any = null;
    if (orderDoc.userId) {
      try {
        const UserModel = (await import('../models/User')).default;
        user = await UserModel.findById(orderDoc.userId).select('email phone').lean();
      } catch (err) {
        console.error('Error fetching user for order:', err);
      }
    }
    const items = await OrderItemModel.find({ orderId: id }).lean();
    // Fetch product details for each item
    const enrichedItems = await Promise.all(items.map(async item => {
      let product: any = null;
      try {
        const ProductModel = (await import('../models/Product')).default;
        product = await ProductModel.findById(item.productId).select('name price images').lean();
      } catch (err) {
        console.error('Error fetching product for item:', err);
      }
      return { 
        ...item, 
        id: item._id,
        productName: product && 'name' in product ? product.name : 'Unknown Product',
        productPrice: product && 'price' in product ? product.price : item.price,
        productImage: product && 'images' in product && Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : ''
      };
    }));
    // Include id in order
    const orderResponse = { 
      ...orderDoc, 
      id: orderDoc._id,
      customerEmail: user && 'email' in user ? user.email : 'Customer Email',
      customerPhone: user && 'phone' in user ? user.phone : 'Customer Phone',
      totalAmount: ('total' in orderDoc && typeof orderDoc.total === 'number' ? orderDoc.total : 0) || 
                   (('subtotal' in orderDoc && typeof orderDoc.subtotal === 'number' ? orderDoc.subtotal : 0) + 
                    ('tax' in orderDoc && typeof orderDoc.tax === 'number' ? orderDoc.tax : 0) + 
                    ('shipping' in orderDoc && typeof orderDoc.shipping === 'number' ? orderDoc.shipping : 0)),
      shippingCost: ('shipping' in orderDoc ? orderDoc.shipping : 0)
    };
    // Add id to items
    const itemsWithId = enrichedItems;
    // Embed items in the nested order object for admin UI compatibility
    const nestedOrder = { ...orderResponse, items: itemsWithId };
    // Destructure to exclude items from fields spread
    const { items: _omit, ...orderFields } = nestedOrder;
    const responseData = {
      // Nested order now includes items
      order: nestedOrder,
      items: itemsWithId,
      // Spread order fields without re-defining items
      ...orderFields,
      customer_email: user && 'email' in user ? user.email : 'Customer Email',
      customer_phone: user && 'phone' in user ? user.phone : 'Customer Phone',
      shipping_address: orderResponse.shippingAddress || '',
      shipping_city: orderResponse.shippingCity || '',
      shipping_state: orderResponse.shippingState || '',
      shipping_pincode: orderResponse.shippingPincode || '',
      shipping_country: orderResponse.shippingCountry || '',
      billing_address: orderResponse.billingAddress || '',
      billing_city: orderResponse.billingCity || '',
      billing_state: orderResponse.billingState || '',
      billing_pincode: orderResponse.billingPincode || '',
      billing_country: orderResponse.billingCountry || '',
      email: user && 'email' in user ? user.email : 'Customer Email',
      phone: user && 'phone' in user ? user.phone : 'Customer Phone',
      total: orderResponse.totalAmount,
      amount: orderResponse.totalAmount,
      order_total: orderResponse.totalAmount,
      shipping: orderResponse.shippingCost,
      shipping_amount: orderResponse.shippingCost,
      shippingAddressFull: `${orderResponse.shippingAddress || ''}, ${orderResponse.shippingCity || ''}, ${orderResponse.shippingState || ''}, ${orderResponse.shippingPincode || ''}, ${orderResponse.shippingCountry || ''}`.trim().replace(/^,|,$/g, ''),
      billingAddressFull: `${orderResponse.billingAddress || ''}, ${orderResponse.billingCity || ''}, ${orderResponse.billingState || ''}, ${orderResponse.billingPincode || ''}, ${orderResponse.billingCountry || ''}`.trim().replace(/^,|,$/g, ''),
      total_amount: orderResponse.totalAmount
    };
    console.log('Order response sent:', {
      orderId: id,
      customerEmail: user && 'email' in user ? user.email : 'Customer Email',
      customerPhone: user && 'phone' in user ? user.phone : 'Customer Phone',
      shippingAddress: orderResponse.shippingAddress,
      billingAddress: orderResponse.billingAddress,
      totalAmount: orderResponse.totalAmount,
      itemsCount: itemsWithId.length
    });
    return res.json(responseData);
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ message: 'Error fetching order' });
  }
}
