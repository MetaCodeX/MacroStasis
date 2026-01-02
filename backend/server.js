/**
 * =============================================================================
 * BACKSTASIS - WebSocket Server for Chess Engine
 * =============================================================================
 * Servidor WebSocket que coordina partidas de ajedrez IDLE.
 * Se comunica con el motor Python para obtener movimientos.
 *
 * @author Carlos Eduardo Juárez Ricardo
 * @version 1.0.0
 * =============================================================================
 */

const WebSocket = require('ws');
const axios = require('axios');
const http = require('http');

// =============================================================================
// CONFIGURACIÓN desde variables de entorno
// =============================================================================
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 80;
const CHESS_ENGINE_URL = process.env.CHESS_ENGINE_URL || 'http://chessengine:5000';
const MOVE_INTERVAL_MS = parseInt(process.env.MOVE_INTERVAL_MS) || 1500;

// Orígenes permitidos para CORS/WebSocket
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3080')
    .split(',')
    .map(origin => origin.trim());

console.log(`[Backstasis] Entorno: ${NODE_ENV}`);
console.log(`[Backstasis] Orígenes permitidos: ${ALLOWED_ORIGINS.join(', ')}`);

/**
 * Valida si un origen está permitido
 */
function isOriginAllowed(origin, headers = {}) {
    // Debug: log del origen recibido
    console.log(`[Backstasis] Verificando origen: "${origin}", CF-Connecting-IP: ${headers['cf-connecting-ip'] || 'N/A'}`);

    // Permitir si no hay origen (común en Cloudflare Tunnel/WebSocket)
    if (!origin) {
        // Si viene de Cloudflare (tiene headers cf-*), permitir
        if (headers['cf-connecting-ip'] || headers['cf-ray']) {
            console.log('[Backstasis] Conexión permitida: viene de Cloudflare');
            return true;
        }
        // En desarrollo, permitir sin origen
        return NODE_ENV === 'development';
    }

    const allowed = ALLOWED_ORIGINS.some(allowedOrigin => {
        if (allowedOrigin === '*') return true;
        return origin === allowedOrigin || origin.endsWith(allowedOrigin.replace('https://', '.'));
    });

    console.log(`[Backstasis] Origen "${origin}" ${allowed ? 'PERMITIDO' : 'RECHAZADO'}`);
    return allowed;
}

// Crear servidor HTTP - Solo maneja peticiones HTTP normales
// Las peticiones de WebSocket upgrade son manejadas automáticamente por WebSocket.Server
const server = http.createServer((req, res) => {
    const origin = req.headers.origin;

    // Log para debugging
    console.log(`[HTTP] ${req.method} ${req.url} - Upgrade: ${req.headers['upgrade'] || 'none'}`);

    // CORS headers
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'backstasis',
            env: NODE_ENV
        }));
        return;
    }

    // Para cualquier otra petición HTTP (no WebSocket), devolver 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', message: 'Use WebSocket for connection' }));
});

// Crear servidor WebSocket con validación de origen
const wss = new WebSocket.Server({
    server,
    verifyClient: (info, callback) => {
        const origin = info.origin || info.req.headers.origin;
        const headers = info.req.headers;
        const allowed = isOriginAllowed(origin, headers);

        if (!allowed) {
            console.log(`[Backstasis] Conexión WebSocket RECHAZADA desde origen: ${origin}`);
        } else {
            console.log(`[Backstasis] Conexión WebSocket ACEPTADA desde origen: ${origin || 'sin origen'}`);
        }

        callback(allowed, allowed ? undefined : 403, allowed ? undefined : 'Forbidden');
    }
});

/**
 * Clase para manejar una partida de ajedrez
 */
class ChessGame {
    constructor(ws) {
        this.ws = ws;
        this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Posición inicial
        this.isRunning = false;
        this.intervalId = null;
        this.moveCount = 0;
    }

    /**
     * Inicia el juego automático
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('[ChessGame] Partida iniciada');

        // Enviar estado inicial
        this.sendState('game_started');

        // Iniciar loop de movimientos
        this.intervalId = setInterval(() => this.makeMove(), MOVE_INTERVAL_MS);
    }

    /**
     * Detiene el juego
     */
    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('[ChessGame] Partida detenida');
    }

    /**
     * Solicita un movimiento al motor de ajedrez
     */
    async makeMove() {
        if (!this.isRunning) return;

        try {
            const response = await axios.post(`${CHESS_ENGINE_URL}/move`, {
                fen: this.fen
            }, { timeout: 5000 });

            const { move, fen: newFen, status } = response.data;

            if (status === 'game_over') {
                this.sendState('game_over', { lastMove: move });
                this.stop();
                // Reiniciar después de 5 segundos
                setTimeout(() => {
                    this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
                    this.moveCount = 0;
                    this.start();
                }, 5000);
                return;
            }

            this.fen = newFen;
            this.moveCount++;
            this.sendState('move', { move, moveCount: this.moveCount });

        } catch (error) {
            console.error('[ChessGame] Error al obtener movimiento:', error.message);
            // Continuar intentando
        }
    }

    /**
     * Envía el estado actual al cliente
     */
    sendState(event, extra = {}) {
        if (this.ws.readyState !== WebSocket.OPEN) return;

        const message = JSON.stringify({
            event,
            fen: this.fen,
            timestamp: Date.now(),
            ...extra
        });

        this.ws.send(message);
    }
}

// Mapa de juegos activos por conexión
const activeGames = new Map();

// Manejar conexiones WebSocket
wss.on('connection', (ws, req) => {
    const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[WebSocket] Cliente conectado: ${clientId}`);

    // Crear nueva partida para este cliente
    const game = new ChessGame(ws);
    activeGames.set(clientId, game);

    // Manejar mensajes del cliente
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());

            switch (message.action) {
                case 'start':
                    game.start();
                    break;
                case 'stop':
                    game.stop();
                    break;
                case 'restart':
                    game.stop();
                    game.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
                    game.moveCount = 0;
                    game.start();
                    break;
                default:
                    console.log(`[WebSocket] Acción desconocida: ${message.action}`);
            }
        } catch (error) {
            console.error('[WebSocket] Error al parsear mensaje:', error.message);
        }
    });

    // Manejar desconexión
    ws.on('close', () => {
        console.log(`[WebSocket] Cliente desconectado: ${clientId}`);
        game.stop();
        activeGames.delete(clientId);
    });

    // Enviar confirmación de conexión
    ws.send(JSON.stringify({
        event: 'connected',
        clientId,
        message: 'Conexión establecida. Envía { "action": "start" } para iniciar la partida.'
    }));
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`[Backstasis] Servidor WebSocket escuchando en puerto ${PORT}`);
    console.log(`[Backstasis] Chess Engine URL: ${CHESS_ENGINE_URL}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('[Backstasis] Recibido SIGTERM, cerrando...');
    activeGames.forEach(game => game.stop());
    wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
});
