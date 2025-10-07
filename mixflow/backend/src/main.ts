/**
 * MixFlow Backend - Express.js Server
 * Music streaming and DJ platform API
 * Refactored version with modular architecture
 */

import express from 'express';
import * as path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Internal imports
import { env } from './config/environment.config';
import { db } from './services/database.service';
import { UploadConfig } from './config/upload.config';
import { apiRoutes } from './routes/index';
import { ErrorMiddleware } from './middleware/error.middleware';

class MixFlowServer {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.isProduction() ? undefined : false,
    }));

    // Compression middleware
    this.app.use(compression());

    // CORS configuration
    this.app.use(cors({
      origin: env.config.corsOrigins.length > 0 ? env.config.corsOrigins : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
      exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    }));

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Additional validation can be added here
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Static file serving
    this.app.use('/uploads', express.static(UploadConfig.getUploadDir(), {
      maxAge: env.isProduction() ? '1d' : 0,
      etag: true,
      lastModified: true,
    }));

    // Request logging in development
    if (env.isDevelopment()) {
      this.app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
      });
    }
  }

  private configureRoutes(): void {
    // API routes
    this.app.use('/api', apiRoutes);

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const dbHealth = await db.healthCheck();
      
      res.status(dbHealth ? 200 : 503).json({
        status: dbHealth ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: env.config.nodeEnv,
        database: dbHealth ? 'connected' : 'disconnected',
        uptime: process.uptime(),
      });
    });
  }

  private configureErrorHandling(): void {
    // 404 handler (must be before error handler)
    this.app.use('*', ErrorMiddleware.notFound);

    // Global error handler (must be last)
    this.app.use(ErrorMiddleware.handle);
  }

  async start(): Promise<void> {
    try {
      // Initialize upload directories
      UploadConfig.initialize();

      // Connect to database
      await db.connect();

      // Start server
      this.server = this.app.listen(env.config.port, () => {
        console.log('🚀 MixFlow API Server Started');
        console.log(`📡 Server running at: http://localhost:${env.config.port}`);
        console.log(`📋 API documentation: http://localhost:${env.config.port}/api`);
        console.log(`🏥 Health check: http://localhost:${env.config.port}/health`);
        console.log(`📁 Upload directory: ${UploadConfig.getUploadDir()}`);
        console.log(`🌍 Environment: ${env.config.nodeEnv}`);
        console.log('✨ Ready to accept requests!\n');
      });

      this.server.on('error', this.handleServerError.bind(this));

      // Graceful shutdown handlers
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private handleServerError(error: any): void {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof env.config.port === 'string'
      ? 'Pipe ' + env.config.port
      : 'Port ' + env.config.port;

    switch (error.code) {
      case 'EACCES':
        console.error(`❌ ${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`❌ ${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    // Close server
    if (this.server) {
      this.server.close(() => {
        console.log('🔌 HTTP server closed');
      });
    }

    try {
      // Disconnect from database
      await db.disconnect();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new MixFlowServer();
server.start().catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});