"""
=============================================================================
CHESSENGINE - Motor de Ajedrez para Macrostasis
=============================================================================
API REST simple que devuelve movimientos de ajedrez usando python-chess.
Motor básico: selecciona movimientos aleatorios (para demo IDLE).

@author Carlos Eduardo Juárez Ricardo
@version 1.0.0
=============================================================================
"""

import random
from flask import Flask, request, jsonify
import chess

app = Flask(__name__)


def get_random_move(board: chess.Board) -> chess.Move | None:
    """
    Obtiene un movimiento aleatorio legal.
    Motor simple para demostración.
    """
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return None
    return random.choice(legal_moves)


# =============================================================================
# MOTOR MINIMAX - Tryhard Mode 🔥
# =============================================================================

# Valores de las piezas (en centipeones)
PIECE_VALUES = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 20000
}

# Tablas de posición para cada pieza (perspectiva blancas)
# Bonus por estar en buenas casillas
# NOTA: Las tablas están desde la perspectiva de fila 8 (arriba) a fila 1 (abajo)
PAWN_TABLE = [
    0,   0,   0,   0,   0,   0,   0,   0,   # Fila 8 (promoción)
    50,  50,  50,  50,  50,  50,  50,  50,  # Fila 7
    20,  20,  30,  40,  40,  30,  20,  20,  # Fila 6
    10,  10,  20,  35,  35,  20,  10,  10,  # Fila 5
    5,   5,  15,  30,  30,  15,   5,   5,   # Fila 4 (centro!)
    5,   5,  10,  25,  25,  10,   5,   5,   # Fila 3
    0,   0,   0,  10,  10,   0,   0,   0,   # Fila 2 (inicial) - bonus para d2->d4, e2->e4
    0,   0,   0,   0,   0,   0,   0,   0    # Fila 1 (nunca hay peones aquí)
]

KNIGHT_TABLE = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
]

BISHOP_TABLE = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
]

ROOK_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
]

QUEEN_TABLE = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
]

KING_MIDGAME_TABLE = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20
]

PIECE_TABLES = {
    chess.PAWN: PAWN_TABLE,
    chess.KNIGHT: KNIGHT_TABLE,
    chess.BISHOP: BISHOP_TABLE,
    chess.ROOK: ROOK_TABLE,
    chess.QUEEN: QUEEN_TABLE,
    chess.KING: KING_MIDGAME_TABLE
}


def evaluate_board(board: chess.Board) -> int:
    """
    Evalúa la posición del tablero.
    Retorna puntuación positiva si blancas van ganando, negativa si negras.
    """
    if board.is_checkmate():
        return -20000 if board.turn else 20000
    
    if board.is_stalemate() or board.is_insufficient_material():
        return 0
    
    score = 0
    
    # Evaluar cada pieza
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is None:
            continue
        
        # Valor base de la pieza
        value = PIECE_VALUES[piece.piece_type]
        
        # Bonus posicional
        table = PIECE_TABLES[piece.piece_type]
        if piece.color == chess.WHITE:
            value += table[square]
        else:
            # Invertir tabla para negras
            value += table[chess.square_mirror(square)]
        
        # Sumar o restar según el color
        if piece.color == chess.WHITE:
            score += value
        else:
            score -= value
    
    # Bonus por movilidad (más opciones = mejor)
    mobility = len(list(board.legal_moves))
    score += mobility * 2 if board.turn == chess.WHITE else -mobility * 2
    
    # Penalización por rey expuesto
    if board.is_check():
        score -= 50 if board.turn == chess.WHITE else 50
    
    return score


def minimax(board: chess.Board, depth: int, alpha: int, beta: int, maximizing: bool) -> int:
    """
    Algoritmo Minimax con poda alfa-beta.
    """
    if depth == 0 or board.is_game_over():
        return evaluate_board(board)
    
    if maximizing:
        max_eval = -float('inf')
        for move in board.legal_moves:
            board.push(move)
            eval_score = minimax(board, depth - 1, alpha, beta, False)
            board.pop()
            max_eval = max(max_eval, eval_score)
            alpha = max(alpha, eval_score)
            if beta <= alpha:
                break  # Poda beta
        return max_eval
    else:
        min_eval = float('inf')
        for move in board.legal_moves:
            board.push(move)
            eval_score = minimax(board, depth - 1, alpha, beta, True)
            board.pop()
            min_eval = min(min_eval, eval_score)
            beta = min(beta, eval_score)
            if beta <= alpha:
                break  # Poda alfa
        return min_eval


def get_smart_move(board: chess.Board, depth: int = 2) -> chess.Move | None:
    """
    Motor Minimax con selección probabilística y bonus de apertura.
    Favorece variedad en los movimientos iniciales.
    """
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return None
    
    maximizing = board.turn == chess.WHITE
    scored_moves = []
    
    # Contar movimientos totales para saber si estamos en apertura
    move_number = board.fullmove_number
    is_opening = move_number <= 10  # Primeros 10 movimientos
    
    # Evaluar todos los movimientos
    for move in legal_moves:
        board.push(move)
        score = minimax(board, depth - 1, -float('inf'), float('inf'), not maximizing)
        board.pop()
        
        piece = board.piece_at(move.from_square)
        
        # ========== BONUS DE PROMOCIÓN DE PEONES ==========
        # Si el movimiento es una promoción, dar un bonus ENORME
        if move.promotion:
            # Bonus basado en la pieza a la que se promociona
            promotion_bonus = {
                chess.QUEEN: 800,   # Reina es lo mejor
                chess.ROOK: 450,
                chess.BISHOP: 300,
                chess.KNIGHT: 300   # A veces útil para jaque mate
            }
            bonus = promotion_bonus.get(move.promotion, 0)
            score += bonus if maximizing else -bonus
        
        # ========== BONUS POR AVANZAR PEONES HACIA PROMOCIÓN ==========
        if piece and piece.piece_type == chess.PAWN:
            to_rank = chess.square_rank(move.to_square)
            # Para blancas, filas más altas son mejores (7 = promoción)
            # Para negras, filas más bajas son mejores (0 = promoción)
            if piece.color == chess.WHITE:
                # Bonus exponencial por cercanía a la fila 8
                advancement_bonus = (to_rank ** 2) * 3  # 0, 3, 12, 27, 48, 75, 108, 147
                score += advancement_bonus
            else:
                # Para negras, filas bajas son mejores
                advancement_bonus = ((7 - to_rank) ** 2) * 3
                score -= advancement_bonus
        
        # BONUS DE APERTURA: favorecer movimientos de peón inicial
        if is_opening:
            if piece and piece.piece_type == chess.PAWN:
                # Bonus grande para avances de peón central (d,e)
                from_file = chess.square_file(move.from_square)
                if from_file in [3, 4]:  # d=3, e=4
                    score += 30 if maximizing else -30
                else:
                    # Bonus menor para otros peones
                    score += 15 if maximizing else -15
                    
                # Bonus extra por avance de 2 casillas
                if abs(move.to_square - move.from_square) == 16:
                    score += 10 if maximizing else -10
        
        scored_moves.append((move, score))
    
    # Ordenar por score (mejor primero)
    if maximizing:
        scored_moves.sort(key=lambda x: x[1], reverse=True)
    else:
        scored_moves.sort(key=lambda x: x[1])
    
    # Elegir aleatoriamente entre los top N mejores movimientos
    top_n = min(5, len(scored_moves))
    best_moves = scored_moves[:top_n]
    
    # Pesos: el mejor tiene más probabilidad, pero no exclusiva
    weights = [40, 25, 20, 10, 5][:top_n]
    
    chosen_move, _ = random.choices(best_moves, weights=weights, k=1)[0]
    return chosen_move


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'service': 'chessengine',
        'version': '1.0.0'
    })


@app.route('/move', methods=['POST'])
def get_move():
    """
    Obtiene el siguiente movimiento para la posición dada.
    
    Request body:
        { "fen": "rnbqkbnr/pppppppp/..." }
    
    Response:
        { "move": "e2e4", "fen": "...", "status": "ok" | "game_over" }
    """
    try:
        data = request.get_json()
        
        if not data or 'fen' not in data:
            return jsonify({
                'error': 'Missing FEN string',
                'status': 'error'
            }), 400
        
        fen = data['fen']
        
        # Crear tablero desde FEN
        try:
            board = chess.Board(fen)
        except ValueError as e:
            return jsonify({
                'error': f'Invalid FEN: {str(e)}',
                'status': 'error'
            }), 400
        
        # Verificar si el juego terminó
        if board.is_game_over():
            result = board.result()
            return jsonify({
                'move': None,
                'fen': fen,
                'status': 'game_over',
                'result': result,
                'reason': _get_game_over_reason(board)
            })
        
        # Obtener movimiento
        move = get_smart_move(board)
        
        if move is None:
            return jsonify({
                'move': None,
                'fen': fen,
                'status': 'game_over',
                'result': board.result()
            })
        
        # Aplicar movimiento
        board.push(move)
        
        # Verificar si terminó después del movimiento
        status = 'game_over' if board.is_game_over() else 'ok'
        
        response = {
            'move': move.uci(),  # Formato UCI: e2e4
            'fen': board.fen(),
            'status': status,
            'turn': 'white' if board.turn else 'black'
        }
        
        if status == 'game_over':
            response['result'] = board.result()
            response['reason'] = _get_game_over_reason(board)
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


def _get_game_over_reason(board: chess.Board) -> str:
    """Obtiene la razón por la que terminó el juego."""
    if board.is_checkmate():
        return 'checkmate'
    elif board.is_stalemate():
        return 'stalemate'
    elif board.is_insufficient_material():
        return 'insufficient_material'
    elif board.is_fifty_moves():
        return 'fifty_moves'
    elif board.is_repetition():
        return 'repetition'
    return 'unknown'


@app.route('/validate', methods=['POST'])
def validate_move():
    """
    Valida si un movimiento es legal.
    
    Request body:
        { "fen": "...", "move": "e2e4" }
    
    Response:
        { "valid": true/false, "new_fen": "..." }
    """
    try:
        data = request.get_json()
        
        if not data or 'fen' not in data or 'move' not in data:
            return jsonify({
                'error': 'Missing FEN or move',
                'valid': False
            }), 400
        
        board = chess.Board(data['fen'])
        
        try:
            move = chess.Move.from_uci(data['move'])
        except ValueError:
            return jsonify({
                'valid': False,
                'error': 'Invalid move format'
            })
        
        if move in board.legal_moves:
            board.push(move)
            return jsonify({
                'valid': True,
                'new_fen': board.fen()
            })
        else:
            return jsonify({
                'valid': False,
                'error': 'Illegal move'
            })
            
    except Exception as e:
        return jsonify({
            'valid': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
