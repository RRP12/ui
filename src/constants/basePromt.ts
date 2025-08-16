export const basePrompt = `here is an <boltArtifact id="mcp-server" title="MCP Server Template">
<boltAction type="file" filePath="package.json">{
  "name": "mcp-server",
  "version": "1.0.0",
  "description": "TypeScript MCP Server",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "test": "jest",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write ."
  },
  "dependencies": {
    "express": "^4.18.2",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.13.2",
    "@typescript-eslint/eslint-plugin": "^6.13.2",
    "prettier": "^3.1.1",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.10",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3"
  }
}</boltAction>

<boltAction type="file" filePath="tsconfig.json">{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}</boltAction>

<boltAction type="file" filePath=".eslintrc.json">{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "env": {
    "node": true,
    "jest": true
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error"
  }
}</boltAction>

<boltAction type="file" filePath=".prettierrc">{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}</boltAction>

<boltAction type="file" filePath="src/index.ts">import express from 'express';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = config.port || 3000;
app.listen(PORT, () => {
  logger.info("Server running on port " + PORT);
});</boltAction>

<boltAction type="file" filePath="src/config/index.ts">import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.string().default('info'),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  logLevel: env.LOG_LEVEL,
};</boltAction>

<boltAction type="file" filePath="src/middleware/error.middleware.ts">import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  logger.error('Unhandled error:', err);
  
  return res.status(500).json({
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
};</boltAction>

<boltAction type="file" filePath="src/utils/logger.ts">import winston from 'winston';

const { combine, timestamp, printf, colorize, align } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  return "" + timestamp + " [" + level + "]: " + message + " " +
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    align(),
    logFormat
  ),
  transports: [new winston.transports.Console()],
});</boltAction>

<boltAction type="file" filePath="src/utils/errors.ts">export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'ERROR',
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, "" + resource + " not found", 'NOT_FOUND');
  }
}</boltAction>

<boltAction type="file" filePath="src/controllers/base.controller.ts">import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export abstract class BaseController {
  protected abstract execute(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void | any>;

  public async handle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info("" + this.constructor.name + " Handling request: " + req.method + " " + req.path);
      await this.execute(req, res, next);
    } catch (error) {
      logger.error("" + this.constructor.name + " Error:", error);
      next(error);
    }
  }
}</boltAction>

<boltAction type="file" filePath="src/controllers/example.controller.ts">import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { logger } from '../utils/logger';

export class ExampleController extends BaseController {
  protected async execute(req: Request, res: Response): Promise<void> {
    logger.info('Example controller called');
    res.status(200).json({ message: 'Hello from MCP Server!' });
  }
}

export const exampleController = new ExampleController();</boltAction>

<boltAction type="file" filePath="src/routes/example.routes.ts">import { Router } from 'express';
import { exampleController } from '../controllers/example.controller';

const router = Router();

router.get('/', exampleController.handle.bind(exampleController));

export { router as exampleRoutes };</boltAction>

<boltAction type="file" filePath="src/models/example.model.ts">import { z } from 'zod';

export const ExampleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Example = z.infer<typeof ExampleSchema>;</boltAction>

<boltAction type="file" filePath="src/repositories/base.repository.ts">export abstract class BaseRepository<T> {
  protected abstract items: T[];

  async findAll(): Promise<T[]> {
    return [...this.items];
  }

  async findById(id: string): Promise<T | undefined> {
    return this.items.find((item: any) => item.id === id);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const newItem = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as T;
    
    this.items.push(newItem);
    return newItem;
  }
}</boltAction>

<boltAction type="file" filePath="src/repositories/example.repository.ts">import { Example, ExampleSchema } from '../models/example.model';
import { BaseRepository } from './base.repository';

export class ExampleRepository extends BaseRepository<Example> {
  protected items: Example[] = [];
  
  constructor() {
    super();
    // Initialize with some example data
    this.create({
      name: 'First Example',
      description: 'This is the first example',
    });
  }
}

export const exampleRepository = new ExampleRepository();</boltAction></boltArtifact>`;

