# Setup

## 1. Initialize the project

```bash
npm i -g @nestjs/cli
nest new dev-forum-backend --package-manager npm
cd dev-forum-backend
```

## 2. Install dependencies

```bash
# Mongoose
npm install @nestjs/mongoose mongoose

# Auth: Passport + JWT + bcrypt
npm install @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt

# Validation
npm install class-validator class-transformer

# Config
npm install @nestjs/config

# Socket.io (WebSockets)
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

## 3. Environment variables

Copy `.env.example` to `.env` and fill in real values (especially `JWT_SECRET`
and `MONGODB_URI`) before starting the server.

## 4. Run

```bash
npm run start:dev
```
