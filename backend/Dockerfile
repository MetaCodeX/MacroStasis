# =============================================================================
# BACKSTASIS - Dockerfile
# =============================================================================
# WebSocket server para el motor de ajedrez
#
# @author Carlos Eduardo Juárez Ricardo
# @version 1.0.0
# =============================================================================

FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install --omit=dev

# Copiar código fuente
COPY server.js ./

# Puerto por defecto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Iniciar servidor
CMD ["node", "server.js"]
