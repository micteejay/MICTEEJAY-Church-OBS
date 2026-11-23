const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { WebSocketServer } = require(path.join(__dirname, '..', 'node_modules', 'ws'));

const HTTP_PORT = 5510;
const RELAY_PORT = 5511;
const BASE_DIR = path.resolve(__dirname, '..');

let helperProcess = null;

function spawnAiHelper(autoStart = true) {
  if (helperProcess && !helperProcess.killed) {
    console.log('[BSP] AI Helper is already running (pid:', helperProcess.pid, ')');
    return true;
  }

  const electronBin = path.join(BASE_DIR, 'node_modules', 'electron', 'dist', 'electron');
  const helperScript = path.join(BASE_DIR, 'helper-app', 'main.js');

  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  if (!env.DISPLAY) env.DISPLAY = process.env.DISPLAY || ':0';

  const args = [helperScript];
  if (autoStart) args.push('--auto-start-engine');

  console.log('[BSP] Starting AI Helper process:', electronBin, args.join(' '));
  try {
    helperProcess = spawn(electronBin, args, {
      cwd: BASE_DIR,
      env,
      stdio: ['ignore', 'inherit', 'inherit'],
      detached: false
    });

    helperProcess.on('exit', (code, sig) => {
      console.log(`[BSP] AI Helper process exited (code=${code}, sig=${sig})`);
      helperProcess = null;
    });

    helperProcess.on('error', (err) => {
      console.error('[BSP] AI Helper spawn error:', err);
      helperProcess = null;
    });
    return true;
  } catch (err) {
    console.error('[BSP] Failed to spawn AI Helper:', err);
    helperProcess = null;
    return false;
  }
}

function stopAiHelper() {
  if (helperProcess && !helperProcess.killed) {
    try {
      helperProcess.kill('SIGTERM');
    } catch (_) {}
    helperProcess = null;
  }
}

process.on('SIGINT', () => { stopAiHelper(); process.exit(); });
process.on('SIGTERM', () => { stopAiHelper(); process.exit(); });
process.on('exit', () => { stopAiHelper(); });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  let pathname = decodeURIComponent(url.pathname);

  // API endpoints for AI control
  if (pathname === '/api/ai/start' || pathname === '/api/ai/summon') {
    const ok = spawnAiHelper(true);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok, running: ok }));
    return;
  }
  if (pathname === '/api/ai/stop') {
    stopAiHelper();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, running: false }));
    return;
  }
  if (pathname === '/api/ai/status') {
    const running = !!(helperProcess && !helperProcess.killed);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ running, pid: helperProcess ? helperProcess.pid : null }));
    return;
  }

  if (pathname === '/') pathname = '/BSP_display.html';

  let filePath = path.join(BASE_DIR, pathname.replace(/^\/+/, ''));
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

httpServer.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.log(`[BSP] HTTP port ${HTTP_PORT} already running.`);
  } else {
    console.error('[BSP] HTTP error:', err);
  }
});

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`[BSP] HTTP server listening on http://0.0.0.0:${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: RELAY_PORT, host: '0.0.0.0' });
const clients = new Set();

wss.on('listening', () => {
  console.log(`[BSP] WebSocket relay listening on ws://0.0.0.0:${RELAY_PORT}`);
});

wss.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.log(`[BSP] WS relay port ${RELAY_PORT} already running.`);
  } else {
    console.error('[BSP] WS error:', err);
  }
});

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('message', (msg) => {
    const raw = msg.toString();
    try {
      const data = JSON.parse(raw);
      if (data && (data.type === 'ai:start' || data.type === 'ai:helper-summon')) {
        spawnAiHelper(true);
      }
    } catch (_) {}

    clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(raw);
      }
    });
  });
});
