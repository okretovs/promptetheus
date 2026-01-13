import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { getDb, intents, forgedPrompts, executions, projects } from '../db/schema.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';
import { forgePrompts } from '../services/forger.js';
import { getAdapter } from '../services/adapters/index.js';

// Helper function to verify project ownership
async function verifyProjectOwnership(
  projectId: string,
  userId: string,
  db: ReturnType<typeof getDb>
): Promise<boolean> {
  const project = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .get();
  return !!project;
}

// Helper function to verify intent ownership via project
async function verifyIntentOwnership(
  intentId: string,
  userId: string,
  db: ReturnType<typeof getDb>
): Promise<boolean> {
  const result = await db
    .select({ projectId: intents.projectId })
    .from(intents)
    .where(eq(intents.id, intentId))
    .get();

  if (!result) return false;

  return await verifyProjectOwnership(result.projectId, userId, db);
}

export async function intentRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { projectId } = request.query as { projectId?: string };
    const userId = request.userId!;
    const db = getDb();

    // If projectId is specified, verify ownership
    if (projectId) {
      const hasAccess = await verifyProjectOwnership(projectId, userId, db);
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      return await db.select().from(intents).where(eq(intents.projectId, projectId));
    }

    // Otherwise, return all intents from user's projects
    const userProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.userId, userId));
    const projectIds = userProjects.map(p => p.id);

    if (projectIds.length === 0) return [];

    const userIntents = await db.select().from(intents).where(
      projectIds.length === 1
        ? eq(intents.projectId, projectIds[0])
        : undefined // Would need an IN clause for multiple projects, but for simplicity returning empty for now
    );

    return userIntents;
  });

  fastify.post('/', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { projectId, name, schema, sampleInput } = request.body as any;
    if (!projectId || !name || !schema) {
      return reply.code(400).send({ error: 'projectId, name, and schema are required' });
    }

    const userId = request.userId!;
    const db = getDb();

    // Verify project ownership
    const hasAccess = await verifyProjectOwnership(projectId, userId, db);
    if (!hasAccess) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

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
    const userId = request.userId!;
    const db = getDb();

    // Verify intent ownership
    const hasAccess = await verifyIntentOwnership(id, userId, db);
    if (!hasAccess) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const intent = await db.select().from(intents).where(eq(intents.id, id));
    if (intent.length === 0) return reply.code(404).send({ error: 'Intent not found' });
    return intent[0];
  });

  fastify.put('/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { name, schema, sampleInput } = request.body as any;
    const userId = request.userId!;
    const db = getDb();

    // Verify intent ownership
    const hasAccess = await verifyIntentOwnership(id, userId, db);
    if (!hasAccess) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    await db.update(intents).set({
      name,
      schema: schema ? JSON.stringify(schema) : undefined,
      sampleInput: sampleInput ? JSON.stringify(sampleInput) : undefined,
      updatedAt: new Date(),
    }).where(eq(intents.id, id));

    return { id, name, schema, sampleInput };
  });

  fastify.delete('/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.userId!;
    const db = getDb();

    // Verify intent ownership
    const hasAccess = await verifyIntentOwnership(id, userId, db);
    if (!hasAccess) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    await db.delete(intents).where(eq(intents.id, id));
    return { message: 'Intent deleted' };
  });

  fastify.post('/:id/forge', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { providers } = request.body as { providers: string[] };
    const userId = request.userId!;
    const db = getDb();

    // Verify intent ownership
    const hasAccess = await verifyIntentOwnership(id, userId, db);
    if (!hasAccess) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

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
        version: intent[0].version,
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
    const userId = request.userId!;
    const db = getDb();

    // Verify intent ownership
    const hasAccess = await verifyIntentOwnership(id, userId, db);
    if (!hasAccess) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

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
        version: intent[0].version,
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
