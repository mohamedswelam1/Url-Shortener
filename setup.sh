#!/bin/bash
set -e

echo "Setting up URL Shortener Service"

# Update Prisma schema
cat > prisma/schema.prisma << 'EOF'
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Url {
  id           Int       @id @default(autoincrement())
  shortCode    String    @unique
  originalUrl  String
  createdAt    DateTime  @default(now())
  lastAccessed DateTime?
  accessCount  Int       @default(0)

  @@index([shortCode])
}
EOF

# Create .env file
cat > .env << 'EOF'
# Application
PORT=3000
BASE_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/url_shortener?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2017",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
EOF

# Update package.json
cat > package.json << 'EOF'
{
  "name": "url-shortener-fresh",
  "version": "1.0.0",
  "description": "URL Shortening Service built with NestJS and Prisma",
  "main": "dist/main.js",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "keywords": ["url-shortener", "nestjs", "prisma"],
  "author": "",
  "license": "ISC"
}
EOF

echo "Setup complete! Run the following commands to get started:"
echo "1. Create the PostgreSQL database: createdb url_shortener"
echo "2. Generate Prisma client: npx prisma generate"
echo "3. Run migrations: npx prisma migrate dev --name init"
echo "4. Start the application: pnpm start:dev" 