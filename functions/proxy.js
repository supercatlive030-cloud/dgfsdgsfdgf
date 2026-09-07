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

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const requestUrl = new URL(request.url);
  const destination = requestUrl.searchParams.get('url');
  if (!destination) return errorResponse('Use /proxy?url=https://example.com', 400);
  if (destination.length > MAX_URL_LENGTH) return errorResponse('The destination URL is too long.', 414);

  let target;
  try {
    target = new URL(destination);
  } catch {
    return errorResponse('Enter a complete URL such as https://example.com.', 400);
  }
  if (!ALLOWED_PROTOCOLS.has(target.protocol)) {
    return errorResponse('Only HTTP and HTTPS websites are supported.', 400);
  }

  try {
    const upstream = await fetch(target, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: { 'User-Agent': request.headers.get('User-Agent') || 'diddys-playhouse-proxy' },
      redirect: 'follow'
    });
    const headers = new Headers(upstream.headers);
    Object.entries(corsHeaders()).forEach(([key, value]) => headers.set(key, value));
    headers.delete('content-security-policy');
    headers.delete('x-frame-options');
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
  } catch (error) {
    return errorResponse(`Upstream request failed: ${error.message}`, 502);
  }
}
