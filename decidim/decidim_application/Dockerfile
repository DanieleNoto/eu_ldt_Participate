FROM decidim/decidim-dev:0.30.1

# Disable manual interaction
ENV DEBIAN_FRONTEND=noninteractive

# Update system and install base dependencies
RUN apt-get update && apt-get install -y \
  curl \
  gnupg \
  ca-certificates \
  build-essential \
  sudo \
  lsb-release \
  apt-transport-https \
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

RUN node --version && npm --version && ruby --version && bundle --version

# Copy entrypoint and ensure it is executable
COPY docker-entrypoint.sh /code/docker-entrypoint.sh
RUN chmod +x /code/docker-entrypoint.sh
RUN chmod +x /bin/*
