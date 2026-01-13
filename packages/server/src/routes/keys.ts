import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { getDb, apiKeys } from '../db/schema.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';

export async function keyRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authMiddleware }, async (request: AuthenticatedRequest) => {
    const db = getDb();
    const userKeys = await db.select({
      provider: apiKeys.provider,
      createdAt: apiKeys.createdAt,
    }).from(apiKeys).where(eq(apiKeys.userId, request.userId!));

    const providers = ['openai', 'anthropic', 'google', 'local'];
    return providers.map(provider => ({
      provider,
      hasKey: userKeys.some(k => k.provider === provider),
    }));
  });

  fastify.post('/', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { provider, encryptedKey, iv } = request.body as { provider: string; encryptedKey: string; iv: string };

    if (!provider || !encryptedKey || !iv) {
      return reply.code(400).send({ error: 'provider, encryptedKey, and iv are required' });
    }

    const db = getDb();
    const keyId = nanoid();
    await db.insert(apiKeys).values({
      id: keyId,
      userId: request.userId!,
      provider,
      encryptedKey,
      iv,
      createdAt: new Date(),
    });

    return { provider, hasKey: true };
  });

  fastify.delete('/:provider', { preHandler: authMiddleware }, async (request: AuthenticatedRequest) => {
    const { provider } = request.params as { provider: string };
    const db = getDb();

    await db.delete(apiKeys)
      .where(and(eq(apiKeys.provider, provider), eq(apiKeys.userId, request.userId!)));

    return { message: 'API key deleted', provider };
  });
}
