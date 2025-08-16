import { getSystemPrompt } from "./systemPrompt";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

const escapeBraces = (str: string) => {
  if (typeof str !== "string") return str;
  return str.replace(/{/g, "{{").replace(/}/g, "}}");
};

const systemPrompt = escapeBraces(getSystemPrompt());

export const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],

  [
    "user",
    escapeBraces(`
When developing MCP servers with TypeScript, ensure the architecture is robust, maintainable, and follows best practices. The implementation should be production-ready with proper error handling, type safety, and clean separation of concerns.

Key requirements:
  1. Use TypeScript's strong typing throughout the codebase
  2. Implement proper error handling and logging
  3. Follow the MCP (Model - Controller - Presenter) pattern strictly
  4. Include input validation and sanitization
  5. Add comprehensive API documentation
  6. Implement proper testing (unit, integration)
  7. Include environment configuration management
  8. Add proper logging and monitoring
  9. Ensure security best practices are followed
  10. Include proper API versioning

For any UI components (if needed), use a minimal, lightweight approach that doesn't compromise functionality. Focus on clean, maintainable code over unnecessary abstractions.

The implementation should be scalable and include proper documentation for future maintainability. Include clear interfaces for models, well-defined controller methods, and presenters that handle the response formatting.

For any required dependencies, prefer well-maintained, production-ready packages with good community support and clear documentation.
`),
  ],

  [
    "user",
    escapeBraces(`
Here is an example of a MCP server template:

<boltArtifact id="mcp-server" title="MCP Server Template">
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
... rest of files here ...
</boltArtifact>
`),
  ],

  new MessagesPlaceholder("msgs"),
]);
