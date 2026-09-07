const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const MAX_URL_LENGTH = 4096;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function errorResponse(message, status) {
  return new Response(message, {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const requestUrl = new URL(request.url);
    const destination = requestUrl.searchParams.get('url');
    if (!destination) {
      return errorResponse('Use /proxy?url=https://example.com', 400);
    }
    if (destination.length > MAX_URL_LENGTH) {
      return errorResponse('The destination URL is too long.', 414);
    }

    let target;
    try {
      target = new URL(destination);
    } catch {
      return errorResponse('Enter a complete URL such as https://example.com.', 400);
    }
    if (!ALLOWED_PROTOCOLS.has(target.protocol)) {
      return errorResponse('Only HTTP and HTTPS websites are supported.', 400);
    }

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');
    headers.set('X-Proxy-By', 'diddys-playhouse-cloudflare');

    try {
      const upstream = await fetch(target, {
        method: request.method === 'HEAD' ? 'HEAD' : 'GET',
        headers,
        redirect: 'follow'
      });
      const responseHeaders = new Headers(upstream.headers);
      Object.entries(corsHeaders()).forEach(([key, value]) => responseHeaders.set(key, value));
      responseHeaders.delete('content-security-policy');
      responseHeaders.delete('x-frame-options');
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      return errorResponse(`Upstream request failed: ${error.message}`, 502);
    }
  }
};
