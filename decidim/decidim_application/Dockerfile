FROM decidim/decidim-dev:0.30.2 AS builder

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
RUN mkdir -p /code/storage
RUN chown -R decidim:decidim /code/storage
RUN chmod 775 /code/storage

# Copy dependency files FIRST for better Docker layer caching
COPY Gemfile Gemfile.lock ./
COPY engines/ ./engines/

# Install Ruby gems (cached layer) - optimized bundle config
RUN bundle config set --local path '/usr/local/bundle' && \
  bundle config set --local jobs 4 && \
  bundle install --retry 3

COPY package.json yarn.lock* ./

# Install Node.js dependencies (cached layer) - reduced concurrency
RUN yarn install --network-timeout 100000 --include-dev

# NOW copy the full application code
COPY . .

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh



ARG RAILS_ENV=production
ARG NODE_ENV=production
ARG SECRET_KEY_BASE
ENV RAILS_ENV=${RAILS_ENV}
ENV NODE_ENV=${NODE_ENV}
ENV SECRET_KEY_BASE=${SECRET_KEY_BASE}
ENV RAILS_SERVE_STATIC_FILES=true


# Production asset precompilation (separate layer for better caching)
RUN if [ -n "${SECRET_KEY_BASE:-}" ]; then \
  echo "=== Using SECRET_KEY_BASE from build-arg ==="; \
  echo "=== Cleaning previous assets ==="; \
  SECRET_KEY_BASE="${SECRET_KEY_BASE}" RAILS_ENV=production NODE_ENV=production bundle exec rake assets:clean; \
  echo "=== Precompiling assets ==="; \
  SECRET_KEY_BASE="${SECRET_KEY_BASE}" RAILS_ENV=production NODE_ENV=production bundle exec rake assets:precompile; \
  echo "=== Assets precompiled successfully with build-arg ==="; \
  fi


RUN rm -rf node_modules tmp/cache vendor/bundle/spec \
  && rm -rf /usr/local/bundle/cache/*.gem \
  && find /usr/local/bundle/gems/ -name "*.c" -delete \
  && find /usr/local/bundle/gems/ -name "*.o" -delete \
  && rm -rf log/*.log

### Runtime stage: lean image with only runtime dependencies
FROM decidim/decidim-dev:0.30.2 AS runtime

# Inherit build arguments for runtime
ARG RAILS_ENV=production
ARG NODE_ENV=production
ARG SECRET_KEY_BASE
ARG RAILS_SERVE_STATIC_FILES=true
ENV RAILS_SERVE_STATIC_FILES=${RAILS_SERVE_STATIC_FILES}
ENV SECRET_KEY_BASE=${SECRET_KEY_BASE}

# Install only runtime dependencies (no build tools) and ensure Node.js 22 + yarn
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  gnupg \
  netcat-openbsd \
  redis-tools \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && npm install --global yarn \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

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
EXPOSE 3035

ENTRYPOINT ["/code/docker-entrypoint.sh"]
