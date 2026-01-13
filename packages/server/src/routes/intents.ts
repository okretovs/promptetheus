import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { getDb, intents, forgedPrompts, executions } from '../db/schema.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';
import { forgePrompts } from '../services/forger.js';
import { getAdapter } from '../services/adapters/index.js';

export async function intentRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authMiddleware }, async (request: AuthenticatedRequest) => {
    const { projectId } = request.query as { projectId?: string };
    const db = getDb();
    const query = projectId ? eq(intents.projectId, projectId) : undefined;
    return await db.select().from(intents).where(query);
  });

  fastify.post('/', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { projectId, name, schema, sampleInput } = request.body as any;
    if (!projectId || !name || !schema) {
      return reply.code(400).send({ error: 'projectId, name, and schema are required' });
    }

    const db = getDb();
    const intentId = nanoid();
    const newIntent = {
      id: intentId,
      projectId,
      name,
      schema: JSON.stringify(schema),
      sampleInput: sampleInput ? JSON.stringify(sampleInput) : null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(intents).values(newIntent);
    return { ...newIntent, schema, sampleInput };
  });

  fastify.get('/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();
    const intent = await db.select().from(intents).where(eq(intents.id, id));
    if (intent.length === 0) return reply.code(404).send({ error: 'Intent not found' });
    return intent[0];
  });

  fastify.put('/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { name, schema, sampleInput } = request.body as any;
    const db = getDb();

    await db.update(intents).set({
      name,
      schema: schema ? JSON.stringify(schema) : undefined,
      sampleInput: sampleInput ? JSON.stringify(sampleInput) : undefined,
      updatedAt: new Date(),
    }).where(eq(intents.id, id));

    return { id, name, schema, sampleInput };
  });

  fastify.delete('/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest) => {
    const { id } = request.params as { id: string };
    await getDb().delete(intents).where(eq(intents.id, id));
    return { message: 'Intent deleted' };
  });

  fastify.post('/:id/forge', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { providers } = request.body as { providers: string[] };

    const db = getDb();
    const intent = await db.select().from(intents).where(eq(intents.id, id));
    if (intent.length === 0) return reply.code(404).send({ error: 'Intent not found' });

    const schema = typeof intent[0].schema === 'string' ? JSON.parse(intent[0].schema) : intent[0].schema;
    const forged = forgePrompts(schema, providers);

    const results = await Promise.all(forged.map(async (fp) => {
      const promptId = nanoid();
      const prompt = {
        id: promptId,
        intentId: id,
        provider: fp.provider,
        modelName: fp.modelName,
        promptText: fp.promptText,
        createdAt: new Date(),
      };
      await db.insert(forgedPrompts).values(prompt);
      return prompt;
    }));

    return results;
  });

  fastify.post('/:id/execute', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { providers, input } = request.body as { providers: string[]; input: any };

    const db = getDb();
    const intent = await db.select().from(intents).where(eq(intents.id, id));
    if (intent.length === 0) return reply.code(404).send({ error: 'Intent not found' });

    const schema = typeof intent[0].schema === 'string' ? JSON.parse(intent[0].schema) : intent[0].schema;
    const forged = forgePrompts(schema, providers);

    const results = await Promise.all(forged.map(async (fp) => {
      const adapter = getAdapter(fp.provider);
      const result = await adapter.execute(fp.promptText, input, '');

      const promptId = nanoid();
      await db.insert(forgedPrompts).values({
        id: promptId,
        intentId: id,
        provider: fp.provider,
        modelName: fp.modelName,
        promptText: fp.promptText,
        createdAt: new Date(),
      });

      const executionId = nanoid();
      const execution = {
        id: executionId,
        forgedPromptId: promptId,
        input: JSON.stringify(input),
        output: JSON.stringify(result.output),
        latencyMs: result.latencyMs,
        tokens: result.tokens,
        error: null,
        createdAt: new Date(),
      };
      await db.insert(executions).values(execution);

      return {
        provider: fp.provider,
        modelName: fp.modelName,
        promptText: fp.promptText,
        output: result.output,
        latencyMs: result.latencyMs,
        tokens: result.tokens,
      };
    }));

    return results;
  });
}
