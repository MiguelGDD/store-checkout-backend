# store-checkout-backend

Backend API built with NestJS and TypeScript for checkout, payment processing, stock control, and delivery assignment.

## Stack

- NestJS 11
- TypeORM 0.3
- PostgreSQL
- Jest + ts-jest
- Swagger at `/docs`

## Features

- Product catalog
- Checkout flow with pending transaction creation
- Sandbox payment integration
- Automatic stock control after approved payments
- Automatic delivery assignment after approved payments
- Delivery lookup and manual assignment endpoint
- Health check endpoint

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Sandbox payment credentials

## Environment variables

Copy [`.env.example`](./.env.example) to `.env` and set the values below.

| Variable | Description |
| --- | --- |
| `PORT` | Application port |
| `NODE_ENV` | Runtime environment |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `API_KEY` | API key required by the middleware |
| `PAYMENT_API_URL` | Sandbox payment API base URL |
| `PAYMENT_PUBLIC_KEY` | Public payment key |
| `PAYMENT_SECRET_KEY` | Secret payment key |
| `PAYMENT_INTEGRITY_SECRET` | Integrity signature secret |

## Local setup

```bash
npm install
Copy-Item .env.example .env
npm run migration:run
npm run seed
npm run start:dev
```

## Available scripts

- `npm run start:dev`
- `npm run build`
- `npm run test`
- `npm run test:cov -- --runInBand`
- `npm run lint`
- `npm run migration:run`
- `npm run migration:drop`
- `npm run seed`

## Testing

The test suite is configured with a global coverage threshold of 100% for:

- statements
- branches
- functions
- lines

Run the coverage report with:

```bash
npm run test:cov -- --runInBand
```

## Docker

Build the image:

```bash
docker build -t store-checkout-backend .
```

Run the container:

```bash
docker run --rm -p 3000:3000 --env-file .env store-checkout-backend
```

## Fly.io

The repository includes a `fly.toml` file and a Dockerfile ready for Fly.io.

The app is configured to listen on port `3000` and bind to `0.0.0.0`, which is required for Fly's proxy to reach it.

1. Install `flyctl` and authenticate with `fly auth login`.
2. Create or select the Fly app, then set the runtime secrets:

```bash
fly secrets set \
  DB_HOST=... \
  DB_PORT=5432 \
  DB_USERNAME=... \
  DB_PASSWORD=... \
  DB_NAME=... \
  API_KEY=... \
  PAYMENT_API_URL=... \
  PAYMENT_PUBLIC_KEY=... \
  PAYMENT_SECRET_KEY=... \
  PAYMENT_INTEGRITY_SECRET=...
```

3. Deploy the app:

```bash
fly deploy
```

If you need to run migrations against the deployed database, do it from an environment that has the TypeORM CLI dependencies available and the same database variables configured.

## Database

- Run migrations with `npm run migration:run`
- Load seed data with `npm run seed`
- Drop the schema with `npm run migration:drop`

## Endpoints

- `GET /health`
- `GET /products`
- `GET /products/:id`
- `POST /transactions`
- `GET /transactions`
- `GET /transactions/:id`
- `GET /deliveries`
- `GET /deliveries/:id`
- `POST /deliveries/assign/:transactionId`
- Swagger UI: `/docs`
