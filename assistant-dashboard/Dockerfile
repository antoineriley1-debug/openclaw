FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install --save-dev vite @vitejs/plugin-react

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
