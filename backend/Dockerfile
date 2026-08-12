FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (production-only if lockfile present)
RUN npm ci --only=production || npm install --omit=dev

# Copy backend source files
COPY . .

# Create uploads directory if not present
RUN mkdir -p uploads

EXPOSE 5000

CMD ["npm", "start"]
