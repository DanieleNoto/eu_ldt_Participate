FROM decidim/decidim-dev:0.30.1

# Disable manual interaction
ENV DEBIAN_FRONTEND=noninteractive

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
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /code

# Copy package files FIRST for better Docker layer caching
COPY package.json ./
COPY Gemfile ./
COPY engines/ ./engines/
COPY decidim-meetings-jitsi/ ./decidim-meetings-jitsi/

# Install Ruby gems (cached layer)
RUN bundle config set --local deployment 'false' && \
  bundle config set --local path '/usr/local/bundle' && \
  bundle install

# Install Node.js dependencies (cached layer)
RUN yarn install --network-timeout 100000

# NOW copy the application code
COPY . .

# Copy entrypoint and fix line endings + permissions
COPY docker-entrypoint.sh /code/docker-entrypoint.sh
RUN chmod +x /code/docker-entrypoint.sh

# Reinstall gems after copying full code (needed for git dependencies)
RUN bundle install

# Install webpack globally and in the project
RUN npm install -g webpack webpack-cli && \
    cd /code && \
    npm install webpack webpack-cli --save-dev

# Precompile assets for production
RUN if [ "$RAILS_ENV" = "production" ]; then \
    echo "Precompiling assets for production" && \
    SECRET_KEY_BASE=temp_key_for_asset_precompilation \
    RAILS_ENV=production \
    NODE_ENV=production \
    bundle exec rails assets:precompile; \
    fi

# Expose port
EXPOSE 3000
