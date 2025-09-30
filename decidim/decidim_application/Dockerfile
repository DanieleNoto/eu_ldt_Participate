# Build stage: install dependencies and compile assets
FROM decidim/decidim-dev:0.30.1 AS builder

# Disable manual interaction
ENV DEBIAN_FRONTEND=noninteractive
# Set build environment early for dependencies


# Update system and install base dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  apt-transport-https \
  build-essential \
  ca-certificates \
  curl \
  git \
  gnupg \
  libicu-dev \
  libpq-dev \
  libreadline-dev \
  libssl-dev \
  lsb-release \
  netcat-openbsd \
  redis-tools \
  sudo \
  wkhtmltopdf \
  zlib1g-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js 22.x and yarn
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
  apt-get install -y --no-install-recommends nodejs && \
  npm install --global yarn && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /code



# Copy dependency files FIRST for better Docker layer caching
COPY Gemfile Gemfile.lock ./
COPY engines/ ./engines/

# Install Ruby gems (cached layer) - optimized bundle config
RUN bundle config set --local path '/usr/local/bundle' && \
  bundle config set --local jobs 4 && \
  bundle install --retry 3

COPY package.json yarn.lock* ./
# Install Node.js dependencies (cached layer)
RUN yarn install --network-timeout 100000 --include-dev



# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh



ARG RAILS_ENV=production
ARG NODE_ENV=production
ARG SECRET_KEY_BASE=temp_key_for_asset_precompilation 
ENV RAILS_ENV=${RAILS_ENV}
ENV NODE_ENV=${NODE_ENV}
ENV SECRET_KEY_BASE=${SECRET_KEY_BASE}
ENV RAILS_SERVE_STATIC_FILES=true


# Production asset precompilation (separate layer for better caching)
RUN if [ "$RAILS_ENV" = "production" ]; then \
  echo "=== PRODUCTION BUILD: Precompiling assets ===" && \
  RAILS_ENV=production \
  SHAKAPACKER_FORCE=true \
  yes | bundle exec rake shakapacker:install && \
  echo "=== Shakapacker install completed, now precompiling assets ===" && \
  bundle exec rake assets:precompile && \
  echo "=== Assets precompiled, now compiling deface overrides ===" && \
  bundle exec rails deface:precompile && \
  echo "=== Compiling Shakapacker assets ===" && \
  bundle exec rails shakapacker:compile && \
  echo "=== All asset compilation completed ==="; \
  else \
  echo "=== DEVELOPMENT BUILD: Assets served by shakapacker-dev-server ==="; \
  fi

# NOW copy the full application code
COPY . .

RUN rm -rf node_modules tmp/cache vendor/bundle/spec \
  && rm -rf /usr/local/bundle/cache/*.gem \
  && find /usr/local/bundle/gems/ -name "*.c" -delete \
  && find /usr/local/bundle/gems/ -name "*.o" -delete \
  && rm -rf log/*.log

### Runtime stage: lean image with only runtime dependencies
FROM decidim/decidim-dev:0.30.1 AS runtime

# Inherit build arguments for runtime
ARG RAILS_ENV=production
ARG NODE_ENV=production
ARG SECRET_KEY_BASE=temp_key_for_asset_precompilation
ARG RAILS_SERVE_STATIC_FILES=true

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
