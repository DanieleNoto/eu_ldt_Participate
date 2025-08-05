FROM decidim/decidim-dev:0.30.1

# Disable manual interaction
ENV DEBIAN_FRONTEND=noninteractive

# Update system and install base dependencies
RUN apt-get update && apt-get install -y \
  curl \
  gnupg \
  ca-certificates \
  build-essential \
  libssl-dev \
  libreadline-dev \
  zlib1g-dev \
  sudo \
  lsb-release \
  apt-transport-https \
  redis-tools \
  netcat-openbsd \
  && rm -rf /var/lib/apt/lists/*

# Add NodeSource GPG key
RUN mkdir -p /etc/apt/keyrings && \
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
  gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# Add Node.js 20 (LTS) repository
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
  > /etc/apt/sources.list.d/nodesource.list

# Install Node.js
RUN apt-get update && apt-get install -y nodejs

# Set working directory
WORKDIR /code

# Create necessary directories for when volume is mounted
RUN mkdir -p tmp/pids public/uploads log

# Copy package files FIRST for better Docker layer caching
COPY package.json package-lock.json ./
COPY Gemfile Gemfile.lock ./

# Install Ruby gems (cached layer)
RUN bundle config set --local deployment 'false' && \
  bundle config set --local path 'vendor/bundle' && \
  bundle install

# Install Node.js dependencies (cached layer)
RUN npm ci 

# NOW copy the application code
COPY . .

# Copy entrypoint and fix line endings + permissions
COPY docker-entrypoint.sh /code/docker-entrypoint.sh

# Expose port
EXPOSE 3000
