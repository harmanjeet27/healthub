import mongoose from "mongoose";

const connectDB = async () => {
  console.log("MongoDB URI:", process.env.MONGODB_URI); // debug print

  await mongoose.connect(process.env.MONGODB_URI, {
  });

  console.log("Database Connected");
};

export default connectDB;
