import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!,{dbName: "chat-app"}).then((mongoose) => mongoose);    
  }

  cached.conn = await cached.promise;
    console.log("Connected to MongoDB");
  return cached.conn;
}
