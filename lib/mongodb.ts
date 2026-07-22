import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseGlobal: MongooseGlobal | undefined;
}

let cached = globalThis.mongooseGlobal;

if (!cached) {
  cached = globalThis.mongooseGlobal = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const cachedNonNull = globalThis.mongooseGlobal!;

  if (cachedNonNull.conn) {
    return cachedNonNull.conn;
  }

  if (!cachedNonNull.promise) {
    const opts = {
      bufferCommands: false,
    };

    cachedNonNull.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cachedNonNull.conn = await cachedNonNull.promise;
  } catch (e) {
    cachedNonNull.promise = null;
    throw e;
  }

  return cachedNonNull.conn;
}
