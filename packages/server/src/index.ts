import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { initDb } from './db/schema.js';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { intentRoutes } from './routes/intents.js';
import { keyRoutes } from './routes/keys.js';
import { modelRoutes } from './routes/models.js';
import { executionRoutes } from './routes/executions.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

async function start() {
  try {
    // Initialize database
    console.log('Initializing database...');
    initDb();
    console.log('Database initialized successfully');

    // Register CORS
    await app.register(cors, {
      origin: true, // Allow all origins in development
      credentials: true,
    });

    // Register JWT
    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    });

    // Register routes
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(projectRoutes, { prefix: '/api/projects' });
    await app.register(intentRoutes, { prefix: '/api/intents' });
    await app.register(keyRoutes, { prefix: '/api/keys' });
    await app.register(modelRoutes, { prefix: '/api/models' });
    await app.register(executionRoutes, { prefix: '/api/executions' });

    // Health check endpoint
    app.get('/api/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start server
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
    console.log(`Health check: http://${host}:${port}/api/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
