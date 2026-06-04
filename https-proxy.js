const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SSL_DIR = '/app/ssl';
const TARGET_PORT = 3000;
const HTTPS_PORT = 3001;
const HTTP_PORT = 3002;

let sslOptions;
try {
  sslOptions = {
    key: fs.readFileSync(path.join(SSL_DIR, 'privkey.pem')),
    cert: fs.readFileSync(path.join(SSL_DIR, 'fullchain.pem')),
  };
  console.log('[HTTPS] SSL certificates loaded successfully');
} catch (e) {
  console.error('[HTTPS] Failed to load SSL certs:', e.message);
  console.error('[HTTPS] Running HTTP-only proxy on port 3001');
  sslOptions = null;
}

function proxy(req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, 'x-forwarded-proto': sslOptions ? 'https' : 'http' },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502);
    res.end('Bad Gateway: ' + e.message);
  });

  req.pipe(proxyReq, { end: true });
}

// HTTPS server (port 3001)
if (sslOptions) {
  https.createServer(sslOptions, proxy).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log('[HTTPS] Proxy listening on port ' + HTTPS_PORT);
  });
} else {
  // Fallback to HTTP if no SSL
  http.createServer(proxy).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log('[HTTP] Fallback proxy listening on port ' + HTTPS_PORT);
  });
}

// HTTP -> HTTPS redirect (port 3002)
http.createServer((req, res) => {
  const host = req.headers.host ? req.headers.host.split(':')[0] : 'lvhuianquan.icu';
  res.writeHead(301, { Location: 'https://' + host + ':' + HTTPS_PORT + req.url });
  res.end();
}).listen(HTTP_PORT, '0.0.0.0', () => {
  console.log('[REDIR] HTTP->HTTPS redirect listening on port ' + HTTP_PORT);
});
