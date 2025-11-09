import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import paymentRoutes from "./routes/paymentRoutes.js";



// app config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());


// make it ready for production 
import path from "path";
const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/clientside/dist")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "clientside", "dist", "index.html"))
  );
}

// api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/payment", paymentRoutes);

// listen 
app.get("/", (req, res) => {
  res.send("Offical Backend Page of the healthHub Application");
});

app.listen(port, () => console.log("Server started", port));
