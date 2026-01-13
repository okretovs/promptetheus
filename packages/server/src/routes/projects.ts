import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { getDb, projects, intents } from '../db/schema.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';

export async function projectRoutes(fastify: FastifyInstance) {
  // List user's projects
  fastify.get('/', { preHandler: authMiddleware }, async (request: AuthenticatedRequest) => {
    const db = getDb();
    const userProjects = await db.select().from(projects).where(eq(projects.userId, request.userId!));
    return userProjects;
  });

  // Create new project
  fastify.post('/', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { name } = request.body as { name: string };
    if (!name) {
      return reply.code(400).send({ error: 'Project name is required' });
    }

    const db = getDb();
    const projectId = nanoid();
    const newProject = {
      id: projectId,
      userId: request.userId!,
      name,
      createdAt: new Date(),
    };

    await db.insert(projects).values(newProject);
    return newProject;
  });

  // Get project details
  fastify.get('/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const project = await db.select().from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, request.userId!)));

    if (project.length === 0) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    return project[0];
  });

  // Update project
  fastify.put('/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };

    if (!name) {
      return reply.code(400).send({ error: 'Project name is required' });
    }

    const db = getDb();
    await db.update(projects)
      .set({ name })
      .where(and(eq(projects.id, id), eq(projects.userId, request.userId!)));

    return { id, name };
  });

  // Delete project
  fastify.delete('/:id', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    await db.delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, request.userId!)));

    return { message: 'Project deleted' };
  });
}
