# Promptetheus
Forge fire into every prompt

## Overview

**Promptetheus** is a self-hosted prompt optimisation platform that helps you create, test, and compare AI prompts across multiple providers. Define your intent with JSON schemas, automatically generate optimised prompts, and compare performance across OpenAI, Anthropic, Google, and local models—all with enterprise-grade security and offline support.

### Key Features

- **Multi-Provider Support**: Test prompts across OpenAI, Anthropic, Google, and Local/Ollama
- **Schema-Driven Prompts**: Define structured outputs with JSON Schema
- **Automatic Prompt Generation**: Forge optimized prompts for each provider
- **Side-by-Side Comparison**: Compare latency, token usage, and output quality
- **Client-Side Encryption**: API keys encrypted with AES-256-GCM before storage
- **PWA with Offline Support**: Full offline functionality with automatic sync
- **Self-Hosted**: Complete control over your data and infrastructure

## Features

### 🎯 Project & Intent Management
Organize your prompt optimization work into projects and intents. Each intent represents a specific use case with version tracking, JSON schema definitions, and sample inputs for testing.

### 📋 JSON Schema Definition
Define the structure and validation rules for your prompts using JSON Schema. The built-in Monaco editor provides syntax highlighting, validation, and formatting tools.

### 🔥 Multi-Provider Prompt Forging
Automatically generate optimized prompts from your JSON schemas for multiple AI providers:
- **OpenAI** (GPT-4o and custom models)
- **Anthropic** (Claude Sonnet 4 and custom models)
- **Google** (Gemini 1.5 Pro and custom models)
- **Local/Ollama** (Llama3 and other local models)

Each provider receives a customized prompt format optimized for their specific requirements.

### ⚡ Prompt Execution & Testing
Execute your forged prompts with sample inputs and collect detailed metrics:
- Output JSON
- Latency (ms)
- Token usage
- Error tracking
- Execution timestamps

### 📊 Results Comparison
View and compare execution results side-by-side:
- Color-coded provider indicators
- Full prompt text display
- Input/output JSON formatting
- Performance metrics
- Historical execution tracking

### 🔐 API Key Management
Securely manage API keys for all providers:
- **Client-side encryption** using Web Crypto API (AES-256-GCM)
- **PBKDF2 key derivation** (100,000 iterations)
- Keys encrypted with user password before storage
- Server never sees plaintext API keys
- Unique initialization vectors for each key

### ⚙️ Custom Model Profiles
Create custom model configurations for each provider:
- Model selection
- Temperature control (0-2)
- Max tokens configuration
- Default profile support

### 📱 PWA with Offline Support
Progressive Web App capabilities for desktop and mobile:
- Install as standalone application
- Full offline functionality
- Automatic background sync every 30 seconds
- Operation queue for offline changes
- IndexedDB for local data storage
- Service worker with intelligent caching strategies

### 🔒 User Authentication
Secure JWT-based authentication:
- User registration and login
- Bcrypt password hashing
- Session management
- Password-derived encryption keys

## User Journey

### Getting Started
1. **Register** an account with username and password
2. **Create** your first project on the dashboard
3. **Add** an intent to define what you want to optimize
4. **Configure** API keys in settings (encrypted client-side)

### Optimizing Prompts
1. **Define** your JSON schema in the intent editor
2. **Provide** sample input data for testing
3. **Select** AI providers you want to test
4. **Forge** prompts (automatically generated for each provider)
5. **Execute** prompts with your sample data
6. **Compare** results across providers

### Analyzing Results
1. View execution history with latency and token metrics
2. Compare outputs side-by-side
3. Identify the best-performing provider for your use case
4. Iterate on your schema based on results

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18.3 | UI framework |
| TypeScript 5.4 | Type safety |
| Vite 5.2 | Build tool and dev server |
| React Router 6 | Client-side routing |
| Zustand 4.5 | State management |
| Monaco Editor | Code editor for JSON schemas |
| Dexie 4.0 | IndexedDB wrapper for offline storage |
| TailwindCSS 3.4 | Utility-first CSS framework |
| Axios 1.7 | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| Fastify 4.27 | Web framework |
| better-sqlite3 | SQLite database |
| Drizzle ORM | Type-safe database ORM |
| @fastify/jwt | JWT authentication |
| @fastify/cors | CORS support |
| bcrypt | Password hashing |
| Zod | Schema validation |

### Security
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Key Derivation**: PBKDF2 (100,000 iterations)
- **Authentication**: JWT tokens
- **Password Hashing**: bcrypt
- **Database**: SQLite with WAL mode

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd promptetheus

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
HOST=0.0.0.0

# Database
DB_PATH=./data/promptetheus.db

# Authentication (CHANGE IN PRODUCTION!)
JWT_SECRET=your-secure-random-string-here

# Logging
LOG_LEVEL=info
```

**⚠️ IMPORTANT**: Change `JWT_SECRET` to a long, random string in production!

### Running in Development

```bash
# Start both server and client
npm run dev

# Or run individually:
npm run dev -w packages/server   # Server on http://localhost:3000
npm run dev -w packages/client   # Client on http://localhost:5173
```

The client will proxy API requests to the server automatically.

### Building for Production

```bash
# Build both packages
npm run build

# Output locations:
# - Client: packages/client/dist/
# - Server: packages/server/dist/
```

### Starting in Production

```bash
# After building
npm start
# Runs: node packages/server/dist/index.js
```

## Deployment

### Option 1: Separate Server + CDN (Recommended)

**Backend:**
```bash
npm run build
cd packages/server
node dist/index.js
```

**Frontend:**
Deploy `packages/client/dist/*` to a CDN (Netlify, Vercel, Cloudflare Pages, etc.)

### Option 2: Single Server with Reverse Proxy

Configure your reverse proxy (nginx, Apache, Caddy) to:
- Serve static files from `packages/client/dist/`
- Proxy `/api/*` requests to the Node.js backend

### Option 3: Platform-as-a-Service

Deploy to platforms like Railway, Render, or Fly.io. You'll need to:
1. Build both packages
2. Configure start command: `node packages/server/dist/index.js`
3. Set environment variables
4. Serve client files separately or configure static file serving

### Production Security Checklist

- [ ] Change `JWT_SECRET` from default value
- [ ] Restrict CORS origins (currently allows all in development)
- [ ] Use HTTPS for all connections
- [ ] Secure database file permissions
- [ ] Set strong password requirements
- [ ] Configure appropriate `NODE_ENV=production`
- [ ] Review and rotate API keys regularly
- [ ] Set up database backups
- [ ] Configure rate limiting (optional but recommended)

## Project Structure

```
promptetheus/
├── packages/
│   ├── client/                      # React PWA Frontend
│   │   ├── public/
│   │   │   ├── manifest.json        # PWA manifest
│   │   │   └── sw.js                # Service worker
│   │   └── src/
│   │       ├── components/          # Reusable UI components
│   │       ├── pages/               # Route pages
│   │       ├── services/            # API client, crypto, sync
│   │       ├── stores/              # Zustand state management
│   │       └── App.tsx              # Main app component
│   │
│   └── server/                      # Fastify API Backend
│       ├── data/                    # SQLite database location
│       └── src/
│           ├── db/
│           │   └── schema.ts        # Database schema
│           ├── routes/              # API endpoints
│           ├── services/
│           │   ├── adapters/        # AI provider adapters
│           │   └── forger.ts        # Prompt generation engine
│           ├── middleware/          # Authentication middleware
│           └── index.ts             # Server entry point
│
├── .env.example                     # Environment variables template
├── package.json                     # Root workspace configuration
└── README.md                        # This file
```

## API Documentation

### Authentication Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Core Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/projects` | List/create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Get/update/delete project |
| GET/POST | `/api/projects/:id/intents` | List/create intents |
| GET/PUT/DELETE | `/api/intents/:id` | Get/update/delete intent |
| POST | `/api/intents/:id/forge` | Generate prompts |
| POST | `/api/intents/:id/execute` | Execute prompts |
| GET | `/api/intents/:id/executions` | Get execution history |
| GET/POST/DELETE | `/api/keys` | Manage API keys |
| GET/POST/PUT/DELETE | `/api/models` | Manage model profiles |

## Security

### Client-Side Encryption

API keys are encrypted before being sent to the server:

1. User's password + salt → PBKDF2 (100k iterations) → Encryption key
2. Encryption key + API key → AES-256-GCM → Encrypted key + IV
3. Server stores encrypted key and IV (never sees plaintext)
4. On retrieval: Encrypted key + IV → User's encryption key → Plaintext API key

### JWT Authentication

- Tokens signed with `JWT_SECRET`
- Tokens include user ID and expiration
- Validated on all protected endpoints
- Stored in localStorage (consider httpOnly cookies for enhanced security)

### Database Security

- SQLite database with WAL (Write-Ahead Logging) mode
- Passwords hashed with bcrypt (10 rounds)
- User-specific encryption salts stored separately
- No plaintext API keys in database

## Development

### Available Scripts

```bash
# Development
npm run dev                    # Start both client and server
npm run dev -w packages/server # Start server only
npm run dev -w packages/client # Start client only

# Building
npm run build                  # Build both packages
npm run build -w packages/server
npm run build -w packages/client

# Database
npm run db:generate            # Generate migrations
npm run db:migrate             # Run migrations

# Code Quality
npm run lint                   # Run ESLint
npm run test                   # Run tests (Vitest)

# Production
npm start                      # Start production server
```

### Database Management

The application uses Drizzle ORM with SQLite:

```bash
# Generate new migration after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate
```

Database file location: `./data/promptetheus.db` (configurable via `DB_PATH`)

### Testing

Run the comprehensive test suite:

```bash
# Start server and client in separate terminals
npm run dev

# In another terminal, run the test script
./test-fixes.sh
```

The test script validates:
- Authentication flows
- Project and intent CRUD operations
- Authorization security
- Forge and execute functionality
- PWA resources (manifest, service worker)

## Contributing

Contributions are welcome! Please ensure:
- TypeScript types are properly defined
- Code follows existing style conventions
- Tests pass before submitting PRs
- Security best practices are maintained

## License

[Add your license information here]

---

**Built with** 🔥 **for prompt optimization enthusiasts**
