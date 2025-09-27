FROM ubuntu:24.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=development

# Install system essentials and SQLite
RUN apt-get update && apt-get install -y \
    git curl build-essential \
    sqlite3 libsqlite3-dev \
    python3 python3-pip \
    jq htop unzip wget \
    ca-certificates gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js LTS (v20)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages for TypeScript development
RUN npm install -g \
    typescript@latest \
    ts-node@latest \
    prisma@latest \
    @prisma/client@latest \
    eslint@latest \
    prettier@latest

# Create working directory
WORKDIR /workspaces/DockerVscode

# Verify installations
RUN node --version && npm --version && sqlite3 --version

# Set up proper permissions
RUN chmod -R 755 /workspaces
