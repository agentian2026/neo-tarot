import { handleInviteOperation } from '../../../src/backend/invite-service.mjs';

const LOCAL_ALLOWED_ORIGINS = new Set(['http://127.0.0.1:4174', 'http://localhost:4174']);
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const database = {
  async rpc(name: string, params: Record<string, unknown>) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Server database environment unavailable');
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Database operation failed');
    return response.json();
  },
};

function headers(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && LOCAL_ALLOWED_ORIGINS.has(origin) ? origin : 'http://127.0.0.1:4174',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin',
  };
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  const responseHeaders = headers(origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: responseHeaders });
  if (request.method !== 'POST' || (origin && !LOCAL_ALLOWED_ORIGINS.has(origin))) {
    return new Response(JSON.stringify({ status: 'ERROR', error: 'INVALID_REQUEST' }), { status: 400, headers: responseHeaders });
  }
  try {
    const result = await handleInviteOperation(await request.json(), database);
    return new Response(JSON.stringify(result), { status: result.status === 'OK' ? 200 : 400, headers: responseHeaders });
  } catch {
    return new Response(JSON.stringify({ status: 'ERROR', error: 'SERVER_ERROR' }), { status: 500, headers: responseHeaders });
  }
});
