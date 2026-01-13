import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  encryptionSalt: text('encryption_salt').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// API Keys table (encrypted)
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(), // 'openai' | 'anthropic' | 'google' | 'local'
  encryptedKey: text('encrypted_key').notNull(),
  iv: text('iv').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Intents table (stores JSON schema)
export const intents = sqliteTable('intents', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  schema: text('schema', { mode: 'json' }).notNull(),
  sampleInput: text('sample_input', { mode: 'json' }),
  version: integer('version').default(1).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Forged prompts table
export const forgedPrompts = sqliteTable('forged_prompts', {
  id: text('id').primaryKey(),
  intentId: text('intent_id').references(() => intents.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(),
  modelName: text('model_name').notNull(),
  promptText: text('prompt_text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Executions table (stores execution results)
export const executions = sqliteTable('executions', {
  id: text('id').primaryKey(),
  forgedPromptId: text('forged_prompt_id').references(() => forgedPrompts.id, { onDelete: 'cascade' }).notNull(),
  input: text('input', { mode: 'json' }).notNull(),
  output: text('output', { mode: 'json' }),
  latencyMs: integer('latency_ms'),
  tokens: integer('tokens'),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Model profiles table
export const modelProfiles = sqliteTable('model_profiles', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  modelName: text('model_name').notNull(),
  config: text('config', { mode: 'json' }),
  isLocal: integer('is_local', { mode: 'boolean' }).default(false),
});

// Database initialization
let db: ReturnType<typeof drizzle>;

export function initDb() {
  const dbPath = process.env.DB_PATH || './data/promptetheus.db';
  const dbDir = path.dirname(dbPath);

  // Ensure data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  db = drizzle(sqlite);

  // Run initial schema creation
  createTables(sqlite);

  return db;
}

function createTables(sqlite: Database.Database) {
  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      encryption_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      iv TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS intents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      schema TEXT NOT NULL,
      sample_input TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forged_prompts (
      id TEXT PRIMARY KEY,
      intent_id TEXT NOT NULL REFERENCES intents(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      model_name TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      forged_prompt_id TEXT NOT NULL REFERENCES forged_prompts(id) ON DELETE CASCADE,
      input TEXT NOT NULL,
      output TEXT,
      latency_ms INTEGER,
      tokens INTEGER,
      error TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS model_profiles (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      model_name TEXT NOT NULL,
      config TEXT,
      is_local INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_intents_project_id ON intents(project_id);
    CREATE INDEX IF NOT EXISTS idx_forged_prompts_intent_id ON forged_prompts(intent_id);
    CREATE INDEX IF NOT EXISTS idx_executions_forged_prompt_id ON executions(forged_prompt_id);
  `);
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}
