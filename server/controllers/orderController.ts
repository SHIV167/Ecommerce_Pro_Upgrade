import { Request, Response } from 'express';
import OrderModel from '../models/Order';
import OrderItemModel from '../models/OrderItem';
import { createShipment } from '../utils/shiprocket';

export async function getOrders(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    if (userId) {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const filter = { userId };
      const total = await OrderModel.countDocuments(filter);
      const orderDocs = await OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      const orders = orderDocs.map(order => ({ ...order, id: order._id.toString() }));
      return res.json({ orders, total });
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
    const orderDocs = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const orders = orderDocs.map(order => ({ ...order, id: order._id.toString() }));

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
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid order ID provided' });
    }
    const orderDoc = await OrderModel.findById(id).lean();
    if (!orderDoc) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // NEW transformation: create address objects
    const shippingAddressObj = {
      fullName: orderDoc.shippingAddress || '',
      addressLine1: orderDoc.shippingAddress || '',
      addressLine2: '',
      city: orderDoc.shippingCity || '',
      state: orderDoc.shippingState || '',
      postalCode: orderDoc.shippingPincode || '',
      country: orderDoc.shippingCountry || ''
    };

    const billingAddressObj = {
      fullName: orderDoc.billingCustomerName || '',
      addressLine1: orderDoc.billingAddress || '',
      addressLine2: '',
      city: orderDoc.billingCity || '',
      state: orderDoc.billingState || '',
      postalCode: orderDoc.billingPincode || '',
      country: orderDoc.billingCountry || ''
    };

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
      id: orderDoc._id,
      userId: orderDoc.userId,
      status: orderDoc.status,
      createdAt: orderDoc.createdAt,
      totalAmount: orderDoc.totalAmount,
      shippingCost: 0, // No shipping cost field; defaulting to 0
      shippingAddress: shippingAddressObj,
      billingAddress: billingAddressObj
    };

    const responseData = {
      order: { ...orderResponse, items: enrichedItems },
      items: enrichedItems,
      customer_email: user && 'email' in user ? user.email : 'Customer Email',
      customer_phone: user && 'phone' in user ? user.phone : 'Customer Phone',
      shipping_address: shippingAddressObj.addressLine1,
      shipping_city: shippingAddressObj.city,
      shipping_state: shippingAddressObj.state,
      shipping_pincode: shippingAddressObj.postalCode,
      shipping_country: shippingAddressObj.country,
      billing_address: billingAddressObj.addressLine1,
      billing_city: billingAddressObj.city,
      billing_state: billingAddressObj.state,
      billing_pincode: billingAddressObj.postalCode,
      billing_country: billingAddressObj.country,
      email: user && 'email' in user ? user.email : 'Customer Email',
      phone: user && 'phone' in user ? user.phone : 'Customer Phone',
      total: orderResponse.totalAmount,
      amount: orderResponse.totalAmount,
      order_total: orderResponse.totalAmount,
      shipping: orderResponse.shippingCost,
      shipping_amount: orderResponse.shippingCost,
      shippingAddressFull: `${shippingAddressObj.addressLine1 || ''}, ${shippingAddressObj.city || ''}, ${shippingAddressObj.state || ''}, ${shippingAddressObj.postalCode || ''}, ${shippingAddressObj.country || ''}`.trim().replace(/^,|,$/g, ''),
      billingAddressFull: `${billingAddressObj.addressLine1 || ''}, ${billingAddressObj.city || ''}, ${billingAddressObj.state || ''}, ${billingAddressObj.postalCode || ''}, ${billingAddressObj.country || ''}`.trim().replace(/^,|,$/g, ''),
      total_amount: orderResponse.totalAmount
    };
    console.log('Order response sent:', {
      orderId: id,
      customerEmail: user && 'email' in user ? user.email : 'Customer Email',
      customerPhone: user && 'phone' in user ? user.phone : 'Customer Phone',
      shippingAddress: orderResponse.shippingAddress,
      billingAddress: orderResponse.billingAddress,
      totalAmount: orderResponse.totalAmount,
      itemsCount: enrichedItems.length
    });
    return res.json(responseData);
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ message: 'Error fetching order' });
  }
}
