# Getting Started

## Requirements

```bash
# NodeJS v16 required
$ node -v

# Install Turborepo globally (v1.8 required)
$ npm install turbo --global

# Check npm version (v9 required)
$ npm -v

# Check Java is installed
$ java -version

# Docker should be installed
$ docker -v
```

## Backend configuration

1. Create environment file `.env.development.local`

```bash
$ cd apps/backend
$ cp .env.sample .env.development.local
```

2. Replace `MARKETPLACE_TWITTER_AUTH_BEARER_TOKEN` value

3. Copy the `firebase-credentials.json` into the `apps/backend` directory

### Frontend configuration

1. Copy `.env` configuration

```bash
$ cd apps/frontend
$ cp .env.sample .env
```

2. In the Browser console set the LocalStorage `auth_token` item to be able to access the Backend API

```js
localStorage.setItem('auth_token', 'YOUR_TOKEN_HERE')
```

## Bootstrap

### Postgres service

```bash
$ docker compose up -d postgres-db # start service
$ docker compose -p bifrost stop postgres-db # stop service
```

### Frontend & Backend

```bash
$ turbo run bootstrap
$ turbo run dev # runs both frontend and backend dev servers
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
