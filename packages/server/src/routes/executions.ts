import { FastifyInstance } from 'fastify';
import { getDb, executions, forgedPrompts } from '../db/schema.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { eq } from 'drizzle-orm';

export async function executionRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authMiddleware }, async (request: AuthenticatedRequest) => {
    const { intentId } = request.query as { intentId?: string };
    const db = getDb();

    if (intentId) {
      const results = await db.select({
        id: executions.id,
        input: executions.input,
        output: executions.output,
        latencyMs: executions.latencyMs,
        tokens: executions.tokens,
        error: executions.error,
        createdAt: executions.createdAt,
        provider: forgedPrompts.provider,
        modelName: forgedPrompts.modelName,
      })
      .from(executions)
      .innerJoin(forgedPrompts, eq(executions.forgedPromptId, forgedPrompts.id))
      .where(eq(forgedPrompts.intentId, intentId));

      return results;
    }

    return await db.select().from(executions);
  });
}
