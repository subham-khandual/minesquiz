import { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:3001,http://localhost:3000').split(',');

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin ${origin} not allowed by policy.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-quiz-attempt-id',
  ],
  exposedHeaders: ['x-total-count', 'x-request-id'],
  maxAge: 86400,
};
