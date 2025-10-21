FROM node:18-alpine

# Install curl for health checks and postgresql-client for database initialization
RUN apk add --no-cache curl postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm ci

# Copy source code
COPY . .

# Build the application and remove dev dependencies after build to keep image size smaller
RUN npm run build && \
	npm ci --only=production && \
	npm cache clean --force

# Copy initialization script
COPY scripts/init-db.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-db.sh

# Expose the port
EXPOSE 3002

# Use initialization script as entrypoint
ENTRYPOINT ["/usr/local/bin/init-db.sh"]

# Start the application
CMD ["npm", "start"]