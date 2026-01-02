/**
 * =============================================================================
 * ChessService - Servicio de conexión WebSocket para el tablero de ajedrez
 * =============================================================================
 * Gestiona la conexión con el backend, cola de movimientos, y animaciones.
 *
 * @author Carlos Eduardo Juárez Ricardo
 * @version 2.0.0
 * =============================================================================
 */

import { Injectable, signal, computed, effect } from '@angular/core';
import { environment } from '../../environments/environment';

// Posición inicial FEN
const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Tipos para los mensajes del WebSocket
interface ChessMessage {
    event: 'connected' | 'game_started' | 'move' | 'game_over';
    fen?: string;
    move?: string;
    moveCount?: number;
    clientId?: string;
    message?: string;
    result?: string;
    reason?: string;
    timestamp?: number;
}

// Tipo para una pieza
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | null;
export type PieceColor = 'w' | 'b' | null;

export interface Square {
    piece: PieceType;
    color: PieceColor;
}

// Movimiento en cola
export interface QueuedMove {
    from: { rank: number; file: number };
    to: { rank: number; file: number };
    fen: string;        // FEN después del movimiento
    uci: string;        // Notación UCI (e.g., "e2e4")
}

@Injectable({
    providedIn: 'root'
})
export class ChessService {
    private ws: WebSocket | null = null;

    // ============================================================================
    // ESTADO DEL BACKEND (posición real)
    // ============================================================================

    /** FEN actual del backend (siempre sincronizado) */
    readonly backendFen = signal<string>(INITIAL_FEN);

    /** Estado de conexión */
    readonly isConnected = signal<boolean>(false);

    /** Contador de movimientos */
    readonly moveCount = signal<number>(0);

    /** Estado del juego */
    readonly gameStatus = signal<'idle' | 'playing' | 'game_over'>('idle');

    // ============================================================================
    // ESTADO VISUAL (para animaciones)
    // ============================================================================

    /** FEN que se renderiza (puede estar detrás del backend durante animación) */
    readonly visualFen = signal<string>(INITIAL_FEN);

    /** Cola de movimientos pendientes de animar */
    readonly moveQueue = signal<QueuedMove[]>([]);

    /** Si hay una animación en curso */
    readonly isAnimating = signal<boolean>(false);

    /** Si la sección de contacto está visible */
    readonly isVisible = signal<boolean>(false);

    /** Movimiento actual siendo animado (para CSS) */
    readonly currentAnimation = signal<QueuedMove | null>(null);

    // ============================================================================
    // COLORES DINÁMICOS
    // ============================================================================

    /** Hue base aleatorio (0-360) */
    readonly baseHue = signal<number>(Math.floor(Math.random() * 360));

    /** Colores generados - Esquema triádico para más variedad */
    readonly colors = computed(() => {
        const hue = this.baseHue();
        // Esquema triádico: colores a 120° de distancia
        const hue2 = (hue + 120) % 360;
        const hue3 = (hue + 240) % 360;

        return {
            // Casillas oscuras - primer color
            darkSquare: `hsla(${hue}, 45%, 25%, 0.5)`,
            darkSquareGradient: `linear-gradient(135deg, hsla(${hue}, 45%, 22%, 0.55), hsla(${hue}, 45%, 30%, 0.45))`,

            // Casillas claras - segundo color
            lightSquare: `hsla(${hue2}, 35%, 35%, 0.4)`,
            lightSquareGradient: `linear-gradient(135deg, hsla(${hue2}, 35%, 32%, 0.45), hsla(${hue2}, 35%, 40%, 0.35))`,

            // Piezas - tercer color (más saturado)
            darkPiece: `hsl(${hue3}, 55%, 35%)`,
            lightPiece: `hsl(${hue3}, 45%, 75%)`,

            // Para CSS variables
            hue: hue,
            hue2: hue2,
            hue3: hue3,
            complementHue: hue2 // Para compatibilidad
        };
    });

    // ============================================================================
    // COMPUTED: TABLERO VISUAL
    // ============================================================================

    /** Tablero visual como matriz 8x8 */
    readonly visualBoard = computed(() => this.fenToBoard(this.visualFen()));

    /** Mitad izquierda del tablero (columnas e-h, índices 4-7) */
    readonly leftHalf = computed(() => {
        const board = this.visualBoard();
        return board.map(row => row.slice(4, 8));
    });

    /** Mitad derecha del tablero (columnas a-d, índices 0-3) */
    readonly rightHalf = computed(() => {
        const board = this.visualBoard();
        return board.map(row => row.slice(0, 4));
    });

    /** Mitad superior del tablero (filas 0-3, negras) - para móvil */
    readonly topHalf = computed(() => {
        const board = this.visualBoard();
        return board.slice(0, 4); // Filas 8-5 (donde empiezan negras)
    });

    /** Mitad inferior del tablero (filas 4-7, blancas) - para móvil */
    readonly bottomHalf = computed(() => {
        const board = this.visualBoard();
        return board.slice(4, 8); // Filas 4-1 (donde empiezan blancas)
    });

    // ============================================================================
    // CONSTRUCTOR Y EFECTOS
    // ============================================================================

    constructor() {
        // Efecto: cuando la sección es visible y hay movimientos en cola, animar
        effect(() => {
            if (this.isVisible() && !this.isAnimating() && this.moveQueue().length > 0) {
                this.playNextMove();
            }
        });
    }

    // ============================================================================
    // CONEXIÓN WEBSOCKET
    // ============================================================================

    /** URL del WebSocket (desde environment) */
    private wsUrl = environment.chessWebSocketUrl;

    /**
     * Conecta al servidor WebSocket
     * Debe llamarse al cargar la página
     */
    connect(url?: string): void {
        if (url) this.wsUrl = url;
        if (this.ws?.readyState === WebSocket.OPEN) return;

        console.log('[ChessService] Conectando a', this.wsUrl);
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
            console.log('[ChessService] Conexión establecida');
            this.isConnected.set(true);
        };

        this.ws.onmessage = (event) => {
            const msg: ChessMessage = JSON.parse(event.data);
            this.handleMessage(msg);
        };

        this.ws.onclose = () => {
            console.log('[ChessService] Conexión cerrada');
            this.isConnected.set(false);
            this.gameStatus.set('idle');

            // Reconectar después de 3 segundos
            setTimeout(() => this.connect(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('[ChessService] Error:', error);
        };
    }

    /**
     * Desconecta del servidor
     */
    disconnect(): void {
        this.ws?.close();
        this.ws = null;
    }

    /**
     * Inicia una partida
     */
    startGame(): void {
        this.send({ action: 'start' });
    }

    // ============================================================================
    // MANEJO DE MENSAJES
    // ============================================================================

    /**
     * Maneja los mensajes entrantes
     */
    private handleMessage(msg: ChessMessage): void {
        switch (msg.event) {
            case 'connected':
                console.log('[ChessService] Servidor respondió:', msg.message);
                this.startGame();
                break;

            case 'game_started':
                this.backendFen.set(msg.fen || INITIAL_FEN);
                this.visualFen.set(msg.fen || INITIAL_FEN);
                this.moveQueue.set([]);
                this.gameStatus.set('playing');
                this.moveCount.set(0);
                break;

            case 'move':
                if (msg.move && msg.fen) {
                    // Actualizar FEN del backend
                    this.backendFen.set(msg.fen);
                    this.moveCount.set(msg.moveCount || this.moveCount() + 1);

                    // Agregar a la cola de animación
                    const queuedMove = this.parseMove(msg.move, msg.fen);
                    if (queuedMove) {
                        this.moveQueue.update(queue => [...queue, queuedMove]);
                    }

                    // Si NO está visible, actualizar visual inmediatamente (sin animar)
                    if (!this.isVisible()) {
                        this.visualFen.set(msg.fen);
                    }
                }
                break;

            case 'game_over':
                this.gameStatus.set('game_over');
                // El backend reiniciará automáticamente
                break;
        }
    }

    // ============================================================================
    // ANIMACIÓN DE MOVIMIENTOS
    // ============================================================================

    /** Duración de la animación en ms */
    private readonly ANIMATION_DURATION = 400;

    /**
     * Reproduce el siguiente movimiento de la cola
     */
    private playNextMove(): void {
        const queue = this.moveQueue();
        if (queue.length === 0 || this.isAnimating()) return;

        // Tomar el primer movimiento
        const [nextMove, ...remaining] = queue;
        this.moveQueue.set(remaining);

        // Iniciar animación
        this.isAnimating.set(true);
        this.currentAnimation.set(nextMove);

        // Esperar que termine la animación CSS
        setTimeout(() => {
            // Actualizar posición visual
            this.visualFen.set(nextMove.fen);
            this.currentAnimation.set(null);
            this.isAnimating.set(false);

            // El effect detectará si hay más movimientos
        }, this.ANIMATION_DURATION);
    }

    // ============================================================================
    // UTILIDADES
    // ============================================================================

    /**
     * Envía un mensaje al servidor
     */
    private send(data: object): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    /**
     * Parsea un movimiento UCI a coordenadas
     */
    private parseMove(uci: string, fen: string): QueuedMove | null {
        if (uci.length < 4) return null;

        const fromFile = uci.charCodeAt(0) - 97;
        const fromRank = 8 - parseInt(uci[1], 10);
        const toFile = uci.charCodeAt(2) - 97;
        const toRank = 8 - parseInt(uci[3], 10);

        return {
            from: { rank: fromRank, file: fromFile },
            to: { rank: toRank, file: toFile },
            fen,
            uci
        };
    }

    /**
     * Convierte notación FEN a una matriz 8x8 de casillas
     */
    private fenToBoard(fen: string): Square[][] {
        const board: Square[][] = [];
        const rows = fen.split(' ')[0].split('/');

        for (let rank = 0; rank < 8; rank++) {
            const row: Square[] = [];
            const fenRow = rows[rank];

            for (const char of fenRow) {
                if (/\d/.test(char)) {
                    for (let i = 0; i < parseInt(char, 10); i++) {
                        row.push({ piece: null, color: null });
                    }
                } else {
                    const isWhite = char === char.toUpperCase();
                    const piece = char.toUpperCase() as PieceType;
                    row.push({
                        piece,
                        color: isWhite ? 'w' : 'b'
                    });
                }
            }
            board.push(row);
        }

        return board;
    }

    /**
     * Regenera colores (nueva paleta aleatoria)
     */
    regenerateColors(): void {
        this.baseHue.set(Math.floor(Math.random() * 360));
    }
}
