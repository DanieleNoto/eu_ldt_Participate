# Production Dockerfile for EU LDT Participate Chatbot Frontend
FROM node:20-alpine

WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY package*.json ./

# Install ALL dependencies (we need devDependencies for building)
RUN npm ci

# Copy ALL source files
COPY . .

# Clean any previous build artifacts and build fresh
RUN rm -rf dist && \
    npm run build && \
    echo "Build complete. Dist contents:" && \
    ls -la dist/ && \
    echo "Verifying chatbot-loader.js first 25 lines:" && \
    head -25 dist/chatbot-loader.js

# Expose port 5001
EXPOSE 5001

# Serve the built files
CMD ["npx", "http-server", "dist", "-p", "5001", "--cors", "-a", "0.0.0.0"]
