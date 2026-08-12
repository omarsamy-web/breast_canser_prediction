# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production || npm install --omit=dev

COPY --from=build /app/dist ./dist

ENV PORT=5173
EXPOSE 5173

CMD ["sh", "-c", "npx serve -s dist -l ${PORT:-5173}"]
