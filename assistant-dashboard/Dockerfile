FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install if no lock file)
RUN npm install

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
