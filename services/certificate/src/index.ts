import http from 'http';
import { HealthCheckResponse } from '@fairgig/contracts';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4002;
const SERVICE_NAME = 'certificate';

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health endpoint
  if (req.method === 'GET' && (req.url === '/health' || req.url === '/api/v1/health')) {
    const healthPayload: HealthCheckResponse = {
      status: 'ok',
      service: SERVICE_NAME,
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthPayload, null, 2));
    return;
  }

  // Root greeting
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        message: 'FairGig Income Certificate Service (Node.js + TypeScript)',
        health: '/health',
        documentation: '/docs',
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.url} not found`,
        timestamp: new Date().toISOString(),
      },
    })
  );
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[fairgig-certificate] Server listening on http://localhost:${PORT}`);
  });
}

export default server;
