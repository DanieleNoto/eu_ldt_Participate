FROM decidim/decidim-dev:0.29.3

# Disabilita interazione manuale
ENV DEBIAN_FRONTEND=noninteractive

# Aggiorna sistema e installa dipendenze base
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    build-essential \
    sudo \
    lsb-release \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

# Aggiunge chiave GPG di NodeSource
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
    gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# Aggiunge repo Node.js 20 (LTS)
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list

# Installa Node.js
RUN apt-get update && apt-get install -y nodejs

# Verifica le versioni