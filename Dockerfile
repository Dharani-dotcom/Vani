# Use the official Node.js 22 image as the base
# Node 22 supports native TypeScript type stripping
FROM node:22-slim AS builder

# Set the working directory
WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend assets
RUN npm run build

# --- Production Environment ---
FROM node:22-slim

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose the application port
EXPOSE 3000

# Start the application
# server.ts handles serving the static dist folder in production mode
CMD ["npm", "start"]
