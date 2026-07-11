# store-checkout-backend

Backend API built with NestJS and TypeScript for checkout, payment processing, stock control, and delivery assignment.

## What is included

- NestJS 11 bootstrap
- Global config module
- Database module placeholder ready for TypeORM
- API key middleware
- Health check endpoint
- Swagger setup at `/docs`
- Jest unit test scaffold

## Requirements

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
# PowerShell
Copy-Item .env.example .env
# Bash
# cp .env.example .env
npm run start:dev
```

## Available scripts

- `npm run start:dev`
- `npm run build`
- `npm run test`
- `npm run test:cov`
- `npm run lint`
- `npm run migration:run`
- `npm run migration:drop`
- `npm run seed`

## Endpoints

- `GET /health`
- Swagger UI: `/docs`
