import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  orderId: String,
  paymentId: String,
  status: { type: String, default: "Success" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Payment", paymentSchema);
