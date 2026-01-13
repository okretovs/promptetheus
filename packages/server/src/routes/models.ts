import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';

export async function modelRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authMiddleware }, async () => {
    return [
      { id: '1', provider: 'openai', modelName: 'gpt-4o', config: null, isLocal: false },
      { id: '2', provider: 'anthropic', modelName: 'claude-sonnet-4-20250514', config: null, isLocal: false },
      { id: '3', provider: 'google', modelName: 'gemini-1.5-pro', config: null, isLocal: false },
      { id: '4', provider: 'local', modelName: 'llama3', config: null, isLocal: true },
    ];
  });
}
