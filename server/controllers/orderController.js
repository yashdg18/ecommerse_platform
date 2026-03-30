import orderModel   from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import { stripe }   from "../server.js";

export const createOrderController = async (req, res) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentMethod,
      paymentInfo,
      itemPrice,
      tax,
      shippingCharges,
      totalAmount,
    } = req.body;

    
    if (!shippingInfo || !orderItems?.length || !totalAmount) {
      return res.status(400).json({ success: false, message: "Missing required order fields" });
    }

    await orderModel.create({
      user:            req.user._id,
      shippingInfo,
      orderItems,
      paymentMethod:   paymentMethod || "COD",
      paymentInfo:     paymentInfo || {},
      itemPrice:       itemPrice       || totalAmount,
      tax:             tax             || 0,
      shippingCharges: shippingCharges || 0,
      totalAmount,
    });

    
    for (const item of orderItems) {
      try {
        if (!item.product || String(item.product).startsWith('demo-')) continue;
        const product = await productModel.findById(item.product);
        if (product) {
          const qty = item.quantity || item.qty || 1;
          product.stock = Math.max(0, product.stock - qty);
          await product.save();
        }
      } catch (_) {}
    }

    res.status(201).json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: "Error creating order", error: error.message });
  }
};

export const getMyOrdersController = async (req, res) => {
  try {
    const orders = await orderModel.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, totalOrder: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
  }
};

export const singleOrderDetailsController = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, order });
  } catch (error) {
    if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid order ID" });
    res.status(500).json({ success: false, message: "Error fetching order", error: error.message });
  }
};

export const paymentsController = async (req, res) => {
  try {
    const { totalAmount } = req.body;
    if (!totalAmount) return res.status(400).json({ success: false, message: "Total amount required" });

    const { client_secret } = await stripe.paymentIntents.create({
      amount:   Math.round(totalAmount * 100), 
      currency: "inr",
    });

    res.status(200).json({ success: true, client_secret });
  } catch (error) {
    res.status(500).json({ success: false, message: "Payment error", error: error.message });
  }
};

export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel.find({}).populate("user", "name email").sort({ createdAt: -1 });
    const total  = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    res.status(200).json({ success: true, totalOrders: orders.length, totalRevenue: total, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching all orders", error: error.message });
  }
};

export const changeOrderStatusController = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const statusFlow = { processing: "shipped", shipped: "deliverd" };
    const next = statusFlow[order.orderStatus];

    if (!next) return res.status(400).json({ success: false, message: "Order already delivered" });

    order.orderStatus = next;
    if (next === "deliverd") order.deliverdAt = Date.now();
    await order.save();

    res.status(200).json({ success: true, message: `Order status updated to: ${next}` });
  } catch (error) {
    if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid order ID" });
    res.status(500).json({ success: false, message: "Error updating order status", error: error.message });
  }
};