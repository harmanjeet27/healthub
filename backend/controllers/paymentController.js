import Razorpay from "razorpay";
import crypto from "crypto";
import appointmentModel from "../models/appointmentModel.js"; // ✅ Make sure path matches your project structure
import dotenv from "dotenv"; 
dotenv.config();

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
    console.log("Creating order for amount:", amount);
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
  console.log("Verifying payment...");
  try {
    console.log("=== VERIFY PAYMENT DEBUG ===");
    console.log(req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      doctorId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log("❌ Missing payment details");
      return res.json({ success: false, message: "Missing payment details" });
    }

    // ✅ Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    console.log("Expected:", expectedSign);
    console.log("Received:", razorpay_signature);

    if (expectedSign !== razorpay_signature) {
      console.log("❌ Payment verification failed: signature mismatch");
      return res.json({ success: false, message: "Payment verification failed" });
    }

    console.log("✅ Signature verified successfully!");

    // ✅ Update appointment status (optional)
    const updated = await appointmentModel.findOneAndUpdate(
      { userId, docId: doctorId },
      { payment: true },
      { new: true }
    );

    console.log("Updated appointment:", updated);

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.json({ success: false, message: "Server error during payment verification" });
  }
};
