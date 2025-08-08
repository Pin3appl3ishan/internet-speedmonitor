# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/ ./

EXPOSE 3001

# Start the backend
CMD ["node", "src/app.js"]