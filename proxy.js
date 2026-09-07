const http = require('http');
const https = require('https');
const net = require('net');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const LOCAL_PROXY_HOSTS = new Set(['localhost:8080', '127.0.0.1:8080', '0.0.0.0:8080']);
const fs = require('fs');
const path = require('path');
const REQUEST_TIMEOUT = 15000;
const MAX_URL_LENGTH = 4096;
const IDEAS_FILE = path.join(__dirname, 'ideas.json');
const MAX_IDEA_BODY = 64 * 1024;

function readSharedIdeas() {
  try {
    const ideas = JSON.parse(fs.readFileSync(IDEAS_FILE, 'utf8'));
    return Array.isArray(ideas) ? ideas : [];
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Could not read shared ideas:', error.message);
    return [];
  }
}

function writeSharedIdeas(ideas) {
  fs.writeFileSync(IDEAS_FILE, JSON.stringify(ideas, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function handleIdeasApi(req, res) {
  if (req.method === 'GET') {
    sendJson(res, 200, readSharedIdeas());
    return true;
  }

  if (req.method === 'DELETE') {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const ideaId = requestUrl.searchParams.get('id');
    const ideas = readSharedIdeas();
    const remaining = ideaId ? ideas.filter((idea) => String(idea.id) !== ideaId) : [];
    writeSharedIdeas(remaining);
    sendJson(res, 200, { deleted: ideas.length - remaining.length });
    return true;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Use GET, POST, or DELETE for ideas.' });
    return true;
  }

  let body = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > MAX_IDEA_BODY) req.destroy();
  });
  req.on('end', () => {
    try {
      const idea = JSON.parse(body);
      if (!idea || typeof idea !== 'object' || !idea.title || !idea.text) {
        sendJson(res, 400, { error: 'A title and description are required.' });
        return;
      }

      const sharedIdea = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        title: String(idea.title).slice(0, 60),
        text: String(idea.text).slice(0, 500),
        link: typeof idea.link === 'string' ? idea.link.slice(0, 300) : '',
        timestamp: Number.isFinite(idea.timestamp) ? idea.timestamp : Date.now()
      };
      const ideas = readSharedIdeas();
      ideas.push(sharedIdea);
      writeSharedIdeas(ideas);
      sendJson(res, 201, sharedIdea);
    } catch (error) {
      sendJson(res, 400, { error: 'Send valid JSON for the idea.' });
    }
  });
  return true;
}

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (['localhost', 'localhost.localdomain'].includes(host) || host.endsWith('.localhost')) {
    return true;
  }
  if (net.isIP(host) === 4) {
    const octets = host.split('.').map(Number);
    return octets[0] === 10 || octets[0] === 127 || (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168);
  }
  return net.isIP(host) === 6 && (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:'));
}

function writeError(res, status, message) {
  if (res.headersSent) {
    res.destroy();
    return;
  }
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(message);
}

function sendProxyPage(res) {
  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Local Proxy</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #0f172a, #111827);
          color: #e5e7eb;
          display: grid;
          place-items: center;
          min-height: 100vh;
        }
        .card {
          background: rgba(17, 24, 39, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 14px;
          padding: 32px;
          width: min(620px, 88vw);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
        }
        h1 { margin-top: 0; }
        code {
          background: rgba(148, 163, 184, 0.14);
          padding: 4px 8px;
          border-radius: 8px;
        }
        ul { line-height: 1.8; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Proxy is running</h1>
        <p>This local proxy is ready to be used in your browser settings.</p>
        <p>Proxy address: <code>http://localhost:8080</code></p>
        <ul>
          <li>Use this as your HTTP proxy in your browser or app.</li>
          <li>Browser requests will be forwarded to the destination site.</li>
          <li>Use the browser's proxy settings to route traffic through this server.</li>
        </ul>
      </div>
    </body>
  </html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function serveLocalFile(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
  const requestedPath = pathname === '/' ? '/proxy.html' : pathname;
  const filePath = path.resolve(__dirname, `.${requestedPath}`);
  const workspaceRoot = path.resolve(__dirname);

  if (!filePath.startsWith(`${workspaceRoot}${path.sep}`)) {
    return false;
  }

  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/plain; charset=utf-8'
  };

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  res.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function getTargetUrl(req) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (requestUrl.pathname === '/proxy') {
    const destination = requestUrl.searchParams.get('url');
    if (!destination) {
      throw new Error('Add a URL with ?url=https://example.com');
    }
    return destination;
  }

  if (req.headers['x-forwarded-url']) {
    return req.headers['x-forwarded-url'];
  }

  const host = req.headers.host;
  if (!host) {
    throw new Error('Missing Host header');
  }

  if (/^https?:\/\//i.test(req.url)) {
    return req.url;
  }

  const target = `http://${host}${req.url}`;
  return target;
}

function forwardRequest(req, res) {
  const host = (req.headers.host || '').toLowerCase();
  if (LOCAL_PROXY_HOSTS.has(host) && !req.headers['x-forwarded-url']) {
    const pathname = new URL(req.url, `http://${host}`).pathname;
    if (pathname !== '/proxy' && serveLocalFile(req, res)) {
      return;
    }
  }

  let targetUrl;

  try {
    targetUrl = getTargetUrl(req);
  } catch (error) {
    writeError(res, 400, `Bad request: ${error.message}`);
    return;
  }

  if (targetUrl.length > MAX_URL_LENGTH) {
    writeError(res, 414, 'The destination URL is too long.');
    return;
  }

  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    writeError(res, 400, 'Enter a complete URL such as https://example.com.');
    return;
  }
  if (!['http:', 'https:'].includes(target.protocol)) {
    writeError(res, 400, 'Only HTTP and HTTPS websites are supported.');
    return;
  }
  if (isBlockedHost(target.hostname)) {
    writeError(res, 403, 'Local and private network destinations are blocked.');
    return;
  }
  const transport = target.protocol === 'https:' ? https : http;
  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    path: `${target.pathname}${target.search}`,
    method: req.method,
    headers: { ...req.headers }
  };

  delete options.headers.host;
  delete options.headers.connection;
  delete options.headers['proxy-connection'];
  delete options.headers['content-length'];

  const upstream = transport.request(options, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 500, {
      ...upstreamRes.headers,
      'X-Proxy-By': 'diddys-playhouse'
    });
    upstreamRes.pipe(res);
  });

  upstream.setTimeout(REQUEST_TIMEOUT, () => upstream.destroy(new Error('upstream timeout')));

  upstream.on('error', (error) => {
    console.error('Proxy request error:', error.code || error.message);
    if (!res.headersSent) {
      writeError(res, 502, `Proxy error: ${error.message || 'upstream unavailable'}`);
    } else {
      res.destroy();
    }
  });

  req.pipe(upstream);
}

function handleConnect(req, socket, head) {
  const target = req.url;
  const [host, portRaw] = target.split(':');
  const port = Number(portRaw || 443);

  if (!host || ![80, 443].includes(port) || isBlockedHost(host)) {
    socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
    return;
  }

  const upstream = net.connect(port, host, () => {
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    if (head.length > 0) {
      upstream.write(head);
    }

    socket.pipe(upstream);
    upstream.pipe(socket);
  });

  upstream.setTimeout(REQUEST_TIMEOUT, () => upstream.destroy());

  upstream.on('error', (error) => {
    console.error('Tunnel error:', error.message);
    socket.destroy();
  });

  socket.on('error', () => {
    upstream.destroy();
  });
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  if (pathname === '/api/ideas') {
    handleIdeasApi(req, res);
    return;
  }
  forwardRequest(req, res);
});

server.on('connect', handleConnect);

server.listen(PORT, HOST, () => {
  console.log(`Proxy listening on http://${HOST}:${PORT}`);
  console.log('Set your browser/device to use this proxy and send requests through it.');
});
