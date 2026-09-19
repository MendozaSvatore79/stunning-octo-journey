/**
 * LIS ANALYZER BRIDGE DAEMON (ASTM 1394 & HL7 MLLP)
 * Zero external dependencies (uses native Node.js net & http modules).
 *
 * Usage:
 *   node scripts/lis-analyzer-bridge.js
 *
 * Ports:
 *   - TCP 5100: Physical Clinical Analyzer listener (Cobas, Sysmex, Mindray, etc.)
 *   - HTTP/WS 5101: Web Browser WebSocket & Status endpoint
 */

const net = require('net');
const http = require('http');
const crypto = require('crypto');

const ANALYZER_TCP_PORT = 5100;
const WS_PORT = 5101;

// ASTM Control Characters
const ENQ = 0x05;
const ACK = 0x06;
const NAK = 0x15;
const EOT = 0x04;
const STX = 0x02;
const ETX = 0x03;
const CR = 0x0D;
const LF = 0x0A;

// HL7 MLLP Control Characters
const SB = 0x0B; // Start of Block
const EB = 0x1C; // End of Block

console.log('================================================================');
console.log('🏥 LabSystem LIS - Servidor Puente de Analizadores Clínicos');
console.log('   Protocolos: ASTM 1394 / HL7 2.x (MLLP)');
console.log('================================================================');

// Almacén de clientes WebSocket conectados (el navegador)
const wsClients = new Set();

function broadcastToBrowser(dataObj) {
  const jsonStr = JSON.stringify(dataObj);
  const payload = Buffer.from(jsonStr, 'utf8');
  const payloadLen = payload.length;

  let header;
  if (payloadLen <= 125) {
    header = Buffer.from([0x81, payloadLen]);
  } else if (payloadLen <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payloadLen, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payloadLen), 2);
  }

  const frame = Buffer.concat([header, payload]);
  for (const client of wsClients) {
    try {
      client.write(frame);
    } catch (e) {
      wsClients.delete(client);
    }
  }
}

// 1. Servidor WebSocket nativo sobre HTTP
const httpServer = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ status: 'running', analyzerPort: ANALYZER_TCP_PORT, wsPort: WS_PORT, clients: wsClients.size }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('LabSystem LIS Analyzer Bridge Active');
});

httpServer.on('upgrade', (req, socket) => {
  const secWebSocketKey = req.headers['sec-websocket-key'];
  if (!secWebSocketKey) {
    socket.destroy();
    return;
  }

  const hash = crypto
    .createHash('sha1')
    .update(secWebSocketKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${hash}`,
  ];

  socket.write(headers.join('\r\n') + '\r\n\r\n');
  wsClients.add(socket);
  console.log(`[WS] Cliente LIS Web conectado desde ${socket.remoteAddress}`);

  socket.on('close', () => {
    wsClients.delete(socket);
    console.log('[WS] Cliente LIS Web desconectado');
  });

  socket.on('error', () => {
    wsClients.delete(socket);
  });
});

httpServer.listen(WS_PORT, () => {
  console.log(`[WS] Servidor LIS Web activo en ws://localhost:${WS_PORT}`);
});

// 2. Servidor TCP para Analizadores Clínicos Físicos
const tcpServer = net.createServer((socket) => {
  const remote = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`\n[ANALIZADOR CONECTADO] Nuevo analizador físico desde: ${remote}`);

  broadcastToBrowser({
    type: 'DEVICE_CONNECTED',
    remote,
    timestamp: new Date().toISOString(),
  });

  let currentBuffer = '';

  socket.on('data', (data) => {
    // Si el analizador envía ENQ (0x05), respondemos ACK (0x06) según norma ASTM E1381
    if (data.includes(ENQ)) {
      console.log('[ASTM] Analizador envió ENQ -> Respondiendo con ACK (0x06)');
      socket.write(Buffer.from([ACK]));
      return;
    }

    // Limpieza de caracteres de control para decodificar texto
    const textChunk = data.toString('latin1');
    currentBuffer += textChunk;

    // Responde ACK a cada frame STX ... ETX
    if (data.includes(STX) || data.includes(ETX)) {
      socket.write(Buffer.from([ACK]));
    }

    // Detectar fin de transmisión ASTM (EOT) o HL7 MLLP (EB CR)
    const isAstmEnd = data.includes(EOT);
    const isHl7End = data.includes(EB);

    if (isAstmEnd || isHl7End || currentBuffer.includes('L|1|N') || (currentBuffer.includes('OBX') && currentBuffer.length > 300)) {
      console.log(`\n[TRAMA COMPLETA RECIBIDA de ${remote}]:\n${currentBuffer}\n---`);

      broadcastToBrowser({
        type: 'RAW_TRANSMISSION',
        protocol: isHl7End || currentBuffer.includes('MSH|') ? 'HL7' : 'ASTM',
        remote,
        payload: currentBuffer,
        timestamp: new Date().toISOString(),
      });

      // Si es HL7 MLLP, responder con ACK HL7 MSA|AA
      if (currentBuffer.includes('MSH|')) {
        const hl7Ack = `${String.fromCharCode(SB)}MSH|^~\\&|LABSYSTEM|CENTRAL|ANALYZER|LOCAL|${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}||ACK|1|P|2.3.1\rMSA|AA|MSG001\r${String.fromCharCode(EB, CR)}`;
        socket.write(Buffer.from(hl7Ack, 'latin1'));
      }

      currentBuffer = '';
    }
  });

  socket.on('close', () => {
    console.log(`[ANALIZADOR DESCONECTADO] ${remote}`);
    broadcastToBrowser({
      type: 'DEVICE_DISCONNECTED',
      remote,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('error', (err) => {
    console.error(`[ERROR TCP] ${remote}:`, err.message);
  });
});

tcpServer.listen(ANALYZER_TCP_PORT, '0.0.0.0', () => {
  console.log(`[TCP] Escuchando analizadores físicos en 0.0.0.0:${ANALYZER_TCP_PORT}`);
  console.log('   Configure en la pantalla de su analizador (Sysmex, Cobas, Mindray):');
  console.log(`   - IP de Destino LIS: IP de esta computadora`);
  console.log(`   - Puerto LIS: ${ANALYZER_TCP_PORT}`);
  console.log('----------------------------------------------------------------\n');
});
