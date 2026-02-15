export const runtime = 'edge';

const API_BASE = 'https://api.crypto-feed.net';
const API_SECRET = process.env.CRYPTO_API_SECRET || 'PUBLIC_TOKEN_V1';

function base64url(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSHA256(message: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const byteArray = Array.from(new Uint8Array(sig));
  return base64url(String.fromCharCode(...byteArray));
}

async function generateApiToken() {
  const ts = Date.now().toString();
  const random = crypto
    .getRandomValues(new Uint8Array(8))
    .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  const payload = `${ts}.${random}`;
  const signature = await hmacSHA256(payload, API_SECRET);
  return `${payload}.${signature}`;
}

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json();

    if (!endpoint || typeof endpoint !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = await generateApiToken();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'x-api-token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream API error: ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
