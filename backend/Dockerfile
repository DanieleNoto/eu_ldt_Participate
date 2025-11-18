FROM node:18-alpine

# Install curl for health checks and postgresql-client for database initialization
RUN apk add --no-cache curl postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Create user and group early
RUN npm ci --ignore-scripts && \
	addgroup -S app && adduser -S -G app app

# Copy source code (root owns application code to keep it immutable at runtime)
COPY . .

# Build the application and remove dev dependencies after build to keep image size smaller
RUN npm run build && \
	npm ci --only=production --ignore-scripts && \
	npm cache clean --force

# Copy initialization script with restrictive permissions (read/execute only)
COPY scripts/init-db.sh /usr/local/bin/
RUN chown root:root /usr/local/bin/init-db.sh && \
	chmod 0555 /usr/local/bin/init-db.sh && \
	mkdir -p /app/tmp && chown app:app /app/tmp

# Run the container as the non-root user from here on
USER app

# Expose the port
EXPOSE 3002

# Use initialization script as entrypoint
ENTRYPOINT ["/usr/local/bin/init-db.sh"]

# Start the application
CMD ["npm", "start"]