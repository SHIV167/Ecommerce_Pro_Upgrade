# Dockerfile for EcommercePro server
# Use Node 18 on Debian slim
FROM node:18-bullseye-slim

# Install MongoDB database tools for mongodump
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add - \
    && echo "deb http://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list \
    && apt-get update \
    && apt-get install -y mongodb-database-tools \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies (including dev for tsx)
COPY package*.json ./
RUN npm ci --only=production

# Copy all source
COPY . .

# Expose server port
EXPOSE 5000

# Start in production mode (uses tsx to run TypeScript)
CMD ["npm", "run", "start"]
RUN mongodump --version
