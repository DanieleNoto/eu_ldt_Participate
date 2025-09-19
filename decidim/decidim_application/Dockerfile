
ARG RAILS_ENV=production
ARG PRECOMPILE=false
FROM decidim/decidim-dev:0.30.1

# Disable manual interaction
### Multi-stage Dockerfile for Decidim

# Builder stage: install build dependencies, gems, node modules and optionally precompile assets
ARG PRECOMPILE=false
ARG RAILS_ENV=production
FROM decidim/decidim-dev:0.30.1 AS builder

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /code

# Install OS packages and Node.js repository in a single RUN to keep layers small
RUN apt-get update \
  && apt-get install -y \
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
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

# Copy lockfiles first to leverage Docker cache for deps
COPY Gemfile Gemfile.lock ./
COPY package.json yarn.lock ./
COPY engines/ ./engines/
COPY decidim-meetings-jitsi/ ./decidim-meetings-jitsi/

# Install Ruby gems and Node.js deps
RUN bundle config set --local path '/usr/local/bundle' \
  && bundle install --jobs=4 --retry=3 \
  && yarn install --frozen-lockfile --network-timeout 100000

# Copy the application source
COPY . .

# Ensure entrypoint is available
COPY docker-entrypoint.sh /code/docker-entrypoint.sh
RUN chmod +x /code/docker-entrypoint.sh

# Re-run bundle check to handle git-based gems that require source files
RUN bundle check || bundle install --jobs=4 --retry=3

# Optionally precompile assets during build (controlled via build-arg PRECOMPILE)
RUN if [ "$PRECOMPILE" = "true" ] && [ "$RAILS_ENV" = "production" ]; then \
      echo "Precompiling assets for production" && \
      SECRET_KEY_BASE=temp_key_for_asset_precompilation \
      RAILS_ENV=production NODE_ENV=production bundle exec rails assets:precompile; \
    fi

### Runtime stage: smaller image with only runtime artifacts
FROM decidim/decidim-dev:0.30.1 AS runtime
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /code

# Copy application code and artifacts from builder
COPY --from=builder /code /code
# Copy installed gems and node modules to preserve cache
COPY --from=builder /usr/local/bundle /usr/local/bundle

# Expose the application port and set entrypoint
COPY --from=builder /code/docker-entrypoint.sh /code/docker-entrypoint.sh
RUN chmod +x /code/docker-entrypoint.sh

ENV RAILS_ENV=${RAILS_ENV:-production}
ENV NODE_ENV=${NODE_ENV:-production}

EXPOSE 3000

# ENTRYPOINT ["/code/docker-entrypoint.sh"]
# ENTRYPOINT ["sh", "/code/docker-entrypoint.sh"]

# Expose port
