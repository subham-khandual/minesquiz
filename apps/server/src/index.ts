import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';
import { helmetConfig } from './config/helmet';
import { corsConfig } from './config/cors';
import { logger } from './utils/logger';
import { appState } from './config/appState';

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

  const serverInstance = server.listen(env.PORT, () => {
    logger.info(`🚀 Mines Quiz Backend API Server listening on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
  });

  // Graceful Shutdown & Connection Draining Protocol for Zero-Downtime Deployments
  const handleGracefulShutdown = async (signal: string) => {
    if (appState.isShuttingDown) return;
    appState.isShuttingDown = true;
    logger.info(`[Shutdown] Received ${signal}. Starting graceful shutdown and connection draining...`);

    // 1. Notify connected Socket.io WebRTC clients of impending restart
    try {
      io.emit('server_shutdown', {
        message: 'Server restarting for deployment. Client will reconnect automatically.',
        timestamp: Date.now(),
      });
    } catch (socketWarn) {
      logger.warn('[Shutdown] Socket broadcast notice:', socketWarn);
    }

    // 2. Stop accepting new HTTP connections and drain in-flight requests
    serverInstance.close(() => {
      logger.info('[Shutdown] HTTP server closed. In-flight requests successfully drained.');
    });

    // 3. Gracefully disconnect Socket.io engine
    try {
      io.close();
      logger.info('[Shutdown] Socket.io connections closed.');
    } catch {}

    // 4. Forceful exit failsafe if draining exceeds 15 seconds
    const forceExitTimer = setTimeout(() => {
      logger.error('[Shutdown] Draining timed out after 15s. Forcing exit.');
      process.exit(1);
    }, 15000);
    forceExitTimer.unref();

    // 5. Cleanly close MongoDB connection
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        logger.info('[Shutdown] MongoDB Atlas connection cleanly closed.');
      }
    } catch (dbErr) {
      logger.warn('[Shutdown] Database close warning:', dbErr);
    }

    clearTimeout(forceExitTimer);
    logger.info('[Shutdown] Graceful shutdown complete. Exiting cleanly.');
    process.exit(0);
  };

  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal initialization error:', err);
  process.exit(1);
});
