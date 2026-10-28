import mongoose from "mongoose";

export const connectDatabase = async (uri: string, dbName = "hcm-lite"): Promise<void> => {
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  console.log("MongoDB connected");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
