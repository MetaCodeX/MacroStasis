# =============================================================================
# MACROSTASIS FRONTEND - Dockerfile
# =============================================================================
# Multi-stage build for Angular SSR application
# Produces an optimized nginx container serving the static build
#
# @author Carlos Eduardo Juárez Ricardo
# @version 2.0.0
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY macrostasis/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY macrostasis/ ./

# Build for production
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder
COPY --from=builder /app/dist/macrostasis/browser /usr/share/nginx/html

# Copy public assets (SVG icons)
COPY macrostasis/public/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
