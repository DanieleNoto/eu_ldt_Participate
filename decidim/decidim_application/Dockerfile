# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Alvaro Iglesias Sanchez
# Denis Vasilev Dimchev
# Gianfranco Cedro
# Pierluigi Spedicato
# Simone Bianchelli
# denise.scarcelli
FROM decidim/decidim-dev:0.31.1 AS builder

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

# Remove old Node.js and install Node.js 22.x and yarn using n version manager
RUN apt-get remove -y nodejs npm || true && \
  apt-get autoremove -y && \
  curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n -o /usr/local/bin/n && \
  chmod +x /usr/local/bin/n && \
  n 22 && \
  npm install --global yarn && \
  apt-get clean && rm -rf /var/lib/apt/lists/* && \
  node --version && echo "Builder Node.js version: $(node --version)"

# Set working directory and create required directories with proper permissions
WORKDIR /code
RUN mkdir -p /code/storage /code/tmp/pids /code/tmp/cache && \
  chmod -R 755 /code/ && \
  chmod -R 755 /code/tmp 

# Copy dependency files FIRST for better Docker layer caching
# Copy Gemfile first, then Gemfile.lock separately to detect changes
COPY Gemfile ./
COPY Gemfile.lock ./
COPY engines/ ./engines/

# Fix Gemfile.lock permissions so bundle can update it
RUN chmod 666 Gemfile.lock

# Install Ruby gems (cached layer) - optimized bundle config
# Bundle will update Gemfile.lock if needed based on Gemfile changes
RUN bundle config set --local path '/usr/local/bundle' && \
  bundle config set --local jobs 4 && \
  bundle install --retry 3

COPY package.json yarn.lock* ./

# Install Node.js dependencies (cached layer) with retry logic and longer timeout
RUN yarn config set network-timeout 300000 && \
  yarn config set registry https://registry.npmjs.org/ && \
  for i in 1 2 3; do \
  yarn install --include-dev && break || \
  (echo "Yarn install attempt $i failed, retrying..." && sleep 5); \
  done && \
  # Verify webpack is installed
  test -f /code/node_modules/.bin/webpack || (echo "ERROR: webpack not found after yarn install" && exit 1)
# NOW copy the full application code
COPY . .

# Make entrypoint scripts executable
RUN chmod +x docker-entrypoint.sh

ARG RAILS_ENV=production
ARG NODE_ENV=production
ENV RAILS_ENV=${RAILS_ENV}
ENV NODE_ENV=${NODE_ENV}
ENV RAILS_SERVE_STATIC_FILES=true

# NOTE: SECRET_KEY_BASE is no longer required as build-arg since asset precompilation
# is now performed at container startup in docker-entrypoint.sh


# Clean up build artifacts but keep node_modules for runtime asset compilation
RUN rm -rf tmp/cache vendor/bundle/spec \
  && rm -rf /usr/local/bundle/cache/*.gem \
  && find /usr/local/bundle/gems/ -name "*.c" -delete \
  && find /usr/local/bundle/gems/ -name "*.o" -delete \
  && rm -rf log/*.log

### Runtime stage: lean image with only runtime dependencies
FROM decidim/decidim-dev:0.31.1  AS runtime

# Inherit build arguments for runtime
ARG RAILS_ENV=production
ARG NODE_ENV=production
ARG RAILS_SERVE_STATIC_FILES=true
ENV RAILS_SERVE_STATIC_FILES=${RAILS_SERVE_STATIC_FILES}

# Install only runtime dependencies (no build tools) and ensure Node.js 22 + yarn
ENV DEBIAN_FRONTEND=noninteractive
# Create user BEFORE copying files and install runtime dependencies
# Include git which is needed for Decidim's webpacker configuration
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  git \
  gnupg \
  netcat-openbsd \
  redis-tools \
  && apt-get remove -y nodejs npm || true \
  && apt-get autoremove -y \
  && curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n -o /usr/local/bin/n \
  && chmod +x /usr/local/bin/n \
  && n 22 \
  && npm install --global yarn \
  && apt-get clean && rm -rf /var/lib/apt/lists/* \
  && groupadd -r decidim 2>/dev/null || true \
  && useradd -r -g decidim -d /code -s /bin/bash decidim 2>/dev/null || true \
  && node --version && echo "Runtime Node.js version: $(node --version)"

WORKDIR /code

# Copy application and compiled assets from builder with correct ownership
# Use --chmod to ensure entrypoint scripts are executable
COPY --from=builder --chown=decidim:decidim /code /code
COPY --from=builder --chown=decidim:decidim /usr/local/bundle /usr/local/bundle

# Initialize permissions BEFORE switching to decidim user
# Git initialization will be done at runtime in the entrypoint script to avoid permission issues
# Set all directories to 775 and all files to 664 for maximum compatibility with Kubernetes fsGroup
RUN mkdir -p /code/tmp/pids /code/tmp/cache /code/log /code/public /code/storage && \
  chown -R decidim:decidim /code && \
  find /code -path /code/node_modules -prune -o -type d -exec chmod 775 {} + && \
  find /code -path /code/node_modules -prune -o -type f -exec chmod 664 {} + && \
  chmod +x /code/docker-entrypoint.sh && \
  find /code/bin -type f -exec chmod 775 {} + && \
  # Fix permissions for node_modules (don't reinstall, just fix what's already there)
  chown -R decidim:decidim /code/node_modules && \
  chmod -R u+x,g+x,o+x /code/node_modules/.bin 2>/dev/null || true && \
  chmod -R u+r,g+r,o+r /code/node_modules/.bin 2>/dev/null || true && \
  # Verify webpack is present
  test -f /code/node_modules/.bin/webpack || (echo "ERROR: webpack not found in runtime stage" && exit 1)

# Set runtime environment
ENV RAILS_ENV=${RAILS_ENV}
ENV NODE_ENV=${NODE_ENV}

# IMPORTANT: Keep as root for this final chmod
RUN chmod -R u+x,g+x,o+x /code/node_modules/.bin 2>/dev/null || true && \
  find /code/node_modules -type f -path '*/bin/*' -exec chmod 775 {} + 2>/dev/null || true && \
  chmod -R u+r,g+r,o+r /code/node_modules/.bin 2>/dev/null || true

USER decidim

EXPOSE 3000
EXPOSE 3035

ENTRYPOINT ["/code/docker-entrypoint.sh"]
