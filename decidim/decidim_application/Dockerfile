# Build stage: install dependencies and compile assets
FROM decidim/decidim-dev:0.30.1 AS builder

# Disable manual interaction
ENV DEBIAN_FRONTEND=noninteractive
# Set build environment early for dependencies
ARG RAILS_ENV=production
ARG NODE_ENV=production
ENV RAILS_ENV=${RAILS_ENV}
ENV NODE_ENV=${NODE_ENV}
ENV RAILS_SERVE_STATIC_FILES=true

# Update system and install base dependencies
RUN apt-get update && apt-get install -y \
  apt-transport-https \
  build-essential \
  ca-certificates \
  curl \
  gnupg \
  libreadline-dev \
  libssl-dev \
  lsb-release \
  netcat-openbsd \
  redis-tools \
  sudo \
  zlib1g-dev \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x via NodeSource repository
RUN mkdir -p /etc/apt/keyrings && \
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
  apt-get update && \
  apt-get install -y nodejs && \
  rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /code



# Copy dependency files FIRST for better Docker layer caching
COPY Gemfile Gemfile.lock ./
COPY package.json yarn.lock* ./
COPY engines/ ./engines/

# Install Ruby gems (cached layer) - optimized bundle config
RUN bundle config set --local path '/usr/local/bundle' && \
  bundle config set --local jobs 4

# Environment-specific gem installation (production excludes dev/test gems)
RUN [ "$RAILS_ENV" = "production" ] && \
  bundle config set --local deployment true && \
  bundle config set --local without 'development test' && \
  bundle install --retry 3 || \
  bundle install

# Install Node.js dependencies (cached layer)
RUN yarn install --network-timeout 100000 --include-dev

# NOW copy the full application code
COPY . .

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Final bundle install for git dependencies and local engines
RUN bundle install

# Ensure webpack is available for asset compilation
RUN echo "=== Installing webpack tools ===" && \
  yarn add webpack webpack-cli webpack-dev-server --dev && \
  echo "=== Webpack installed ===" && \
  ls -la node_modules/.bin/webpack*

# Production asset precompilation (separate layer for better caching)
RUN if [ "$RAILS_ENV" = "production" ]; then \
  echo "=== PRODUCTION BUILD: Precompiling assets ===" && \
  bundle exec rake decidim:webpacker:install && \
  bundle exec rake assets:precompile && \
  bundle exec rails deface:precompile && \
  bundle exec rails shakapacker:compile \
  echo "=== Assets precompilation completed ==="; \
  else \
  echo "=== DEVELOPMENT BUILD: Assets served by shakapacker-dev-server ==="; \
  fi

RUN rm -rf node_modules tmp/cache vendor/bundle/spec \
  && rm -rf /usr/local/bundle/cache/*.gem \
  && find /usr/local/bundle/gems/ -name "*.c" -delete \
  && find /usr/local/bundle/gems/ -name "*.o" -delete \
  && find /usr/local/bundle/bundler/gems/ -type d -name "spec" -prune -exec rm -rf {} \; \
  && find /usr/local/bundle/bundler/gems/decidim-* -type d -name "db/migrate" -prune -exec rm -rf {} \; \
  && find /usr/local/bundle/bundler/gems/decidim-* -type d -name "docs" -prune -exec rm -rf {} \; \
  && rm -rf log/*.log

### Runtime stage: lean image with only runtime dependencies
FROM decidim/decidim-dev:0.30.1 AS runtime

# Inherit build arguments for runtime
ARG RAILS_ENV=production
ARG NODE_ENV=production

# Install only runtime dependencies (no build tools)
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
  ca-certificates \
  netcat-openbsd \
  redis-tools \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# Copy application and compiled assets from builder
COPY --from=builder /code /code
COPY --from=builder /usr/local/bundle /usr/local/bundle

# Set runtime environment
ENV RAILS_ENV=${RAILS_ENV}
ENV NODE_ENV=${NODE_ENV}

# Create user and set ownership efficiently (single operation)
RUN groupadd -r decidim 2>/dev/null || true && \
  useradd -r -g decidim -d /code -s /bin/bash decidim 2>/dev/null || true && \
  chown -R decidim:decidim /code
USER decidim

EXPOSE 3000

ENTRYPOINT ["/code/docker-entrypoint.sh"]
