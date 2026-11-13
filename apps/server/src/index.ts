import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';
import { helmetConfig } from './config/helmet';
import { corsConfig } from './config/cors';
import { logger } from './utils/logger';

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);

  // Trust first proxy hop (Nginx / Cloudflare / ALB / Render) for accurate client IP rate limiting
  app.set('trust proxy', 1);

  // Real-time WebRTC & Proctor Telemetry Socket Server
  const io = new SocketIOServer(server, {
    cors: corsConfig,
  });

  // Connect to Database
  await connectDatabase();

  // Security Middlewares
  app.use(helmetConfig);
  app.use(cors(corsConfig));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(generalLimiter);

  // Mount API Routes
  app.use('/api/v1', apiRouter);

  // Centralized Error Handling
  app.use(errorHandler);

  // Socket.io WebRTC Signaling & Real-time Room Handling
  io.on('connection', (socket) => {
    logger.info(`[Socket] Client connected: ${socket.id}`);

    // Per-connection packet rate limiter: max 20 events per second to prevent DoS flooding
    let packetWindowStart = Date.now();
    let packetCount = 0;
    const checkSocketRateLimit = (): boolean => {
      const now = Date.now();
      if (now - packetWindowStart > 1000) {
        packetWindowStart = now;
        packetCount = 1;
        return true;
      }
      packetCount += 1;
      return packetCount <= 20;
    };

    socket.on('join_exam_session', ({ attemptId, role }) => {
      if (!checkSocketRateLimit()) {
        logger.warn(`[Socket RateLimit] Dropped excessive join request from ${socket.id}`);
        return;
      }
      socket.join(`session_${attemptId}`);
      logger.info(`[Socket] ${socket.id} joined session_${attemptId} as ${role}`);
    });

    socket.on('webrtc_signal', ({ attemptId, signal, to }) => {
      if (!checkSocketRateLimit()) {
        logger.warn(`[Socket RateLimit] Dropped excessive WebRTC signal from ${socket.id}`);
        return;
      }
      if (to) {
        socket.to(to).emit('webrtc_signal', { signal, from: socket.id });
      } else {
        socket.to(`session_${attemptId}`).emit('webrtc_signal', { signal, from: socket.id });
      }
    });

    socket.on('proctor_violation_alert', ({ attemptId, violation }) => {
      if (!checkSocketRateLimit()) {
        logger.warn(`[Socket RateLimit] Dropped excessive violation alert from ${socket.id}`);
        return;
      }
      socket.to(`session_${attemptId}`).emit('invigilator_violation_notice', violation);
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  server.listen(env.PORT, () => {
    logger.info(`🚀 Mines Quiz Backend API Server listening on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal initialization error:', err);
  process.exit(1);
});
