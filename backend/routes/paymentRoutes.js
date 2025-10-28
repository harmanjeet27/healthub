import express from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import authUser from "../middlewares/authUser.js";

const router = express.Router();

router.post("/create-order", authUser, createOrder);
router.post("/verify", authUser, verifyPayment);

export default router;
