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
        forgedPromptId: executions.forgedPromptId,
        input: executions.input,
        output: executions.output,
        latencyMs: executions.latencyMs,
        tokensUsed: executions.tokens,
        error: executions.error,
        executedAt: executions.createdAt,
        // Forged prompt fields with fp_ prefix
        fp_id: forgedPrompts.id,
        fp_intentId: forgedPrompts.intentId,
        fp_provider: forgedPrompts.provider,
        fp_promptText: forgedPrompts.promptText,
        fp_version: forgedPrompts.version,
        fp_createdAt: forgedPrompts.createdAt,
      })
      .from(executions)
      .innerJoin(forgedPrompts, eq(executions.forgedPromptId, forgedPrompts.id))
      .where(eq(forgedPrompts.intentId, intentId));

      // Transform to include nested forgedPrompt object
      return results.map(row => ({
        id: row.id,
        intentId: row.fp_intentId,
        forgedPromptId: row.forgedPromptId,
        provider: row.fp_provider,
        input: row.input,
        output: row.output,
        latencyMs: row.latencyMs,
        tokensUsed: row.tokensUsed,
        error: row.error,
        executedAt: row.executedAt,
        forgedPrompt: {
          id: row.fp_id,
          intentId: row.fp_intentId,
          provider: row.fp_provider,
          promptText: row.fp_promptText,
          version: row.fp_version,
          createdAt: row.fp_createdAt,
        },
      }));
    }

    return await db.select().from(executions);
  });
}
