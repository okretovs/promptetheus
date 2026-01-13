import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: string;
}

export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    // Extract user ID from JWT payload
    request.userId = (request.user as { userId: string }).userId;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}
