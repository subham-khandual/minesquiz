import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

// Ensure SRV DNS lookup works reliably on Windows and Node.js environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // Fallback to system default DNS
}

export async function connectDatabase(): Promise<void> {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB Atlas at ${env.MONGO_URI}:`, (error as Error).message);
    console.warn(`[Database Warning] Running in offline memory / fallback mode.`);
  }
}
