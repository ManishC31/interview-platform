# === Stage 1: Builder ===
FROM node:22.17.0 AS builder

WORKDIR /app

# Use a dummy Redis URL and disable Redis during build
ARG DISABLE_REDIS=true
ARG REDIS_URL=unix:/tmp/redis.sock
ENV DISABLE_REDIS=${DISABLE_REDIS}
ENV REDIS_URL=${REDIS_URL}

# Install dependencies separately to leverage Docker cache
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js app
RUN npm run build

# === Stage 2: Runtime ===
FROM node:22.17.0

WORKDIR /app

# Copy everything from builder
COPY --from=builder /app /app

EXPOSE 3000

# Start the app
CMD ["npm", "start"]
