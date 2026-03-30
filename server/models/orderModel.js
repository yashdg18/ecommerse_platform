import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      address: { type: String, required: [true, "Address is required"] },
      city:    { type: String, required: [true, "City is required"] },
      country: { type: String, default: "India" },
      phone:   { type: String },
      pin:     { type: String },
    },
    orderItems: [
      {
        name:     { type: String, required: [true, "Product name is required"] },
        price:    { type: Number, required: [true, "Product price is required"] },
        quantity: { type: Number, required: [true, "Quantity is required"], default: 1 },
        image:    { type: String, default: "" },
        product:  { type: mongoose.Schema.Types.Mixed },
      },
    ],
    paymentMethod: {
      type:    String,
      enum:    ["COD", "ONLINE"],
      default: "COD",
    },
    paymentInfo: {
      id:     { type: String, default: "" },
      status: { type: String, default: "pending" },
    },
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Users",
      required: [true, "User ID is required"],
    },
    itemPrice:       { type: Number, default: 0 },
    tax:             { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    totalAmount:     { type: Number, required: [true, "Total amount is required"] },
    orderStatus: {
      type:    String,
      enum:    ["processing", "shipped", "deliverd"],
      default: "processing",
    },
    paidAt:     { type: Date },
    deliverdAt: { type: Date },
  },
  { timestamps: true }
);

const orderModel = mongoose.model("Orders", orderSchema);
export default orderModel;