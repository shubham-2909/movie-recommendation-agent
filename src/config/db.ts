import mongoose from "mongoose";

export const connectToDatabase = async () => {
  const dbUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/movie_agent";
  try {
    await mongoose.connect(dbUri);
    console.log("Connected to MongoDB.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
