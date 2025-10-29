# Production Dockerfile for EU LDT Participate Chatbot Frontend
FROM node:20-alpine

WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache g++ make python3

# Copy package files first for better layer caching
COPY package*.json ./

# Install ALL dependencies (we need devDependencies for building)
RUN npm ci

# Copy ALL source files
COPY . .

# Build application, create non-root user, and set permissions
RUN rm -rf dist && \
    npm run build && \
    echo "Build complete. Dist contents:" && \
    ls -la dist/ && \
    addgroup -S app && adduser -S -G app app && \
    chown -R app:app /app

# Switch to non-root user
USER app

# Expose port 5001
EXPOSE 5001

# Serve the built files
CMD ["npx", "http-server", "dist", "-p", "5001", "--cors", "-a", "0.0.0.0"]
