FROM node:18-alpine

# Install curl for health checks and postgresql-client for database initialization
RUN apk add --no-cache curl postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Create user and group early
RUN npm ci --ignore-scripts && \
	addgroup -S app && adduser -S -G app app

# Copy source code with correct ownership
COPY --chown=app:app . .

# Build the application and remove dev dependencies after build to keep image size smaller
RUN npm run build && \
	npm ci --only=production --ignore-scripts && \
	npm cache clean --force

# Copy initialization script with correct ownership
COPY --chown=app:app scripts/init-db.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-db.sh

# Run the container as the non-root user from here on
USER app

# Expose the port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1
  
# Use initialization script as entrypoint
ENTRYPOINT ["/usr/local/bin/init-db.sh"]

# Start the application
CMD ["npm", "start"]