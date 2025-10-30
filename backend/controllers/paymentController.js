import Razorpay from "razorpay";
import crypto from "crypto";
import appointmentModel from "../models/appointmentModel.js"; // ✅ Make sure path matches your project structure

// ✅ Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ================== CREATE ORDER ==================
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.json({ success: false, message: "Amount is required" });
    }

    // ✅ Convert amount to paise (Razorpay expects in INR paise format)
    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    if (!order) {
      return res.json({ success: false, message: "Failed to create Razorpay order" });
    }

    res.json({ success: true, order,
      key: process.env.RAZORPAY_KEY_ID,
     });
  } catch (error) {
    console.error("Error creating order:", error);
    res.json({ success: false, message: "Server error while creating order" });
  }
};

// ================== VERIFY PAYMENT ==================
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      doctorId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.json({ success: false, message: "Missing payment details" });
    }

    // ✅ Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.json({ success: false, message: "Payment verification failed" });
    }

    // ✅ Update payment status in appointment
    await appointmentModel.findOneAndUpdate(
      { userId, docId: doctorId },
      { payment: true },
      { new: true }
    );

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.json({ success: false, message: "Server error during payment verification" });
  }
};
