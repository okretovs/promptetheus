import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { getDb, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post('/register', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };

    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password are required' });
    }

    if (password.length < 8) {
      return reply.code(400).send({ error: 'Password must be at least 8 characters' });
    }

    try {
      const db = getDb();

      // Check if user already exists
      const existingUsers = await db.select().from(users).where(eq(users.username, username));
      if (existingUsers.length > 0) {
        return reply.code(409).send({ error: 'Username already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate encryption salt for client-side key derivation
      const encryptionSalt = crypto.randomBytes(32).toString('hex');

      // Create user
      const userId = nanoid();
      await db.insert(users).values({
        id: userId,
        username,
        passwordHash,
        encryptionSalt,
        createdAt: new Date(),
      });

      // Generate JWT
      const token = fastify.jwt.sign({ userId });

      reply.send({ token, encryptionSalt });
    } catch (error) {
      console.error('Registration error:', error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };

    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password are required' });
    }

    try {
      const db = getDb();

      // Find user
      const userResults = await db.select().from(users).where(eq(users.username, username));
      if (userResults.length === 0) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const user = userResults[0];

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = fastify.jwt.sign({ userId: user.id });

      reply.send({ token, encryptionSalt: user.encryptionSalt });
    } catch (error) {
      console.error('Login error:', error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Logout (client-side token removal, no server action needed)
  fastify.post('/logout', async (request, reply) => {
    reply.send({ message: 'Logged out successfully' });
  });
}
