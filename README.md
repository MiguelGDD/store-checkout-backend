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

You can run the backend locally with either a local PostgreSQL instance or a
PostgreSQL container.

### Option 1: PostgreSQL installed locally

1. Install dependencies.

```bash
npm install
```

2. Copy the example environment file.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

3. Make sure `.env` points to your local database. The defaults in
`.env.example` already work if PostgreSQL is running on `localhost:5432`.

4. Create the schema.

```bash
npm run migration:run
```

5. Load the initial data.

```bash
npm run seed
```

6. Start the API in watch mode.

```bash
npm run start:dev
```

7. Verify the app.

```bash
curl http://localhost:3000/health
```

### Option 2: PostgreSQL with Docker

If you do not have PostgreSQL installed locally, you can use the database
container from the production compose file.

1. Start only the database container.

```bash
docker compose -f docker-compose.prod.yml up -d db
```

2. Keep these values in `.env`.

```bash
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=store_checkout
```

3. Run migrations.

```bash
npm run migration:run
```

4. Run the seed once.

```bash
npm run seed
```

5. Start the API.

```bash
npm run start:dev
```

6. Verify the app.

```bash
curl http://localhost:3000/health
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

## DigitalOcean VPS

This project can run on a single DigitalOcean Droplet with Docker Compose.

Recommended layout:

- `api` container for NestJS
- `db` container for PostgreSQL
- public traffic on port `80`
- PostgreSQL exposed only on `127.0.0.1:5432`

1. Create the Droplet and SSH into it.
2. Install Docker and Docker Compose.
3. Clone this repository on the server.
4. Create a `.env` file in the repository root with production values.

Example values:

```bash
PORT=3000
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=change-me
DB_NAME=store_checkout
API_KEY=change-me
PAYMENT_API_URL=change-me
PAYMENT_PUBLIC_KEY=change-me
PAYMENT_SECRET_KEY=change-me
PAYMENT_INTEGRITY_SECRET=change-me
```

5. Start the database:

```bash
docker compose -f docker-compose.prod.yml up -d db
```

6. Run migrations from a temporary Node container:

```bash
docker run --rm --network host -v "$PWD":/app -w /app --env-file .env node:20-alpine sh -c "npm ci && npm run migration:run"
```

7. Load the seed data once:

```bash
docker run --rm --network host -v "$PWD":/app -w /app --env-file .env node:20-alpine sh -c "npm ci && npm run seed"
```

8. Start the API:

```bash
docker compose -f docker-compose.prod.yml up -d api
```

9. Verify the app:

```bash
curl http://<PUBLIC_IP>/health
```

Notes:

- Do not expose port `5432` to the public internet.
- Run the seed only once on a fresh database because it truncates the tables.
- If you add a domain later, you can put Nginx or Caddy in front of the API for TLS.

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
