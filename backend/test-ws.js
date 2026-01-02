/**
 * Test script para el backend de ajedrez
 * Simula una conexión WebSocket y observa los movimientos
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3081';
const MAX_MOVES = 10; // Observar 10 movimientos
let moveCount = 0;

console.log('🔌 Conectando a', WS_URL);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('✅ Conexión establecida');
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    switch (msg.event) {
        case 'connected':
            console.log('📡 Servidor respondió:', msg.message);
            console.log('🎮 Iniciando partida...\n');
            ws.send(JSON.stringify({ action: 'start' }));
            break;

        case 'game_started':
            console.log('♟️  PARTIDA INICIADA');
            console.log('   FEN inicial:', msg.fen.substring(0, 40) + '...');
            break;

        case 'move':
            moveCount++;
            const turn = msg.fen.includes(' w ') ? '⬜ Blancas' : '⬛ Negras';
            console.log(`   Movimiento #${msg.moveCount}: ${msg.move} → Turno: ${turn}`);

            if (moveCount >= MAX_MOVES) {
                console.log('\n✅ Test completado - ' + MAX_MOVES + ' movimientos observados');
                ws.close();
                process.exit(0);
            }
            break;

        case 'game_over':
            console.log('\n🏁 PARTIDA TERMINADA');
            console.log('   Último movimiento:', msg.lastMove);
            ws.close();
            process.exit(0);
            break;
    }
});

ws.on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('\n🔌 Conexión cerrada');
});

// Timeout de seguridad
setTimeout(() => {
    console.log('\n⏱️  Timeout - cerrando conexión');
    ws.close();
    process.exit(0);
}, 30000);
