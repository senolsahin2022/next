import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const API_BASE = (Deno.env.get("CRYPTO_API_BASE_URL") || "https://api.crypto-feed.net").replace(/\/+$/, "");
const API_SECRET = Deno.env.get("CRYPTO_API_SECRET") || "PUBLIC_TOKEN_V1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function base64url(str: string) {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmacSHA256(message: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const byteArray = Array.from(new Uint8Array(sig));
  return base64url(String.fromCharCode(...byteArray));
}

async function generateApiToken() {
  const ts = Date.now().toString();
  const random = crypto
    .getRandomValues(new Uint8Array(8))
    .reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");

  const payload = `${ts}.${random}`;
  const signature = await hmacSHA256(payload, API_SECRET);

  return `${payload}.${signature}`;
}

async function callCryptoApi(endpoint: string) {
  try {
    const token = await generateApiToken();

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "x-api-token": token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Crypto API error:", error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { endpoint } = await req.json();

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const data = await callCryptoApi(endpoint);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
