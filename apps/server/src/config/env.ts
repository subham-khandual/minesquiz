import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5050').transform(Number),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/mines-quiz'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3001,http://localhost:3000'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
