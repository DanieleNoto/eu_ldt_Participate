# Production Dockerfile for EU LDT Participate Chatbot Frontend
FROM node:20-alpine

WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache g++ make python3

# Copy package files first for better layer caching
COPY package*.json ./

# Install ALL dependencies (we need devDependencies for building) and create non-root user early
RUN npm ci --ignore-scripts && addgroup -S app && adduser -S -G app app

# Copy ALL source files with correct ownership
COPY --chown=app:app . .

# Build application
RUN rm -rf dist && \
    npm run build && \
    echo "Build complete. Dist contents:" && \
    ls -la dist/

# Switch to non-root user
USER app

# Expose port 5001
EXPOSE 5001

# Serve the built files
CMD ["npx", "http-server", "dist", "-p", "5001", "--cors", "-a", "0.0.0.0"]
