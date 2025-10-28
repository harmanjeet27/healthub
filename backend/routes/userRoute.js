import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  markAppointmentAsPaid
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

// Auth Routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Profile Routes
userRouter.get("/get-profile", authUser, getProfile);
userRouter.post("/update-profile", upload.single("image"), authUser, updateProfile);

// Appointment Routes
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);

// ✅ Route to mark appointment as paid after payment verification
userRouter.post("/mark-paid", authUser, markAppointmentAsPaid);

export default userRouter;
