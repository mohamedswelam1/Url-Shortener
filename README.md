# URL Shortener

A NestJS-based URL shortener service with Redis.

## Features

- Create short URLs with optional custom codes
- Redis caching for improved performance

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your database and Redis configurations.

3. Run database migrations:
   ```
   npx prisma migrate dev
   ```

4. Start the application:
   ```
   npm run start:dev
   ```

## API Endpoints

- `POST /api/urls` - Create a new short URL
- `GET /:code` - Redirect to the original URL

## Requirements

- Node.js 18+
- PostgreSQL
- Redis 