FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build to keep image size smaller
RUN npm ci --only=production && npm cache clean --force

# Expose the port
EXPOSE 3002


# Start the application
CMD ["npm", "start"]