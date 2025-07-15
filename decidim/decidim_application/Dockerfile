FROM decidim/decidim-dev:0.30.1

# Disabilita interazione manuale
ENV DEBIAN_FRONTEND=noninteractive

# Aggiorna sistema e installa dipendenze base
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

RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
    gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list

# Installa Node.js
RUN apt-get update && apt-get install -y nodejs

RUN node --version && npm --version && ruby --version && bundle --version

# Create necessary directories for when volume is mounted
RUN mkdir -p tmp/pids public/uploads log
