import { Db, MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
// sadadsfasfsdfsd
let clientPromise: Promise<MongoClient> | undefined;

if (uri) {
  const client = new MongoClient(uri);
  clientPromise = global._mongoClientPromise || client.connect().then((connected) => connected);

  if (process.env.NODE_ENV !== 'production') {
    global._mongoClientPromise = clientPromise;
  }
}

export async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set. Please configure your MongoDB connection string.');
  }

  if (!clientPromise) {
    throw new Error('MongoDB client is not initialized. Please check your MONGODB_URI environment variable.');
  }

  try {
    const connectedClient = await clientPromise;
    return connectedClient.db();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

