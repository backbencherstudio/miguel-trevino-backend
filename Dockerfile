# Dockerfile
# Use Node.js 20 LTS as base image
FROM node:23.11.1

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs

RUN adduser -S fastify -u 1001

# Change ownership of the app directory
RUN chown -R fastify:nodejs /app

USER fastify

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]