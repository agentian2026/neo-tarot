import { evaluateRelationshipOnServer } from '../../../src/backend/relationship-evaluate.mjs';

const LOCAL_ALLOWED_ORIGINS = new Set([
  'http://127.0.0.1:4174',
  'http://localhost:4174',
]);

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && LOCAL_ALLOWED_ORIGINS.has(origin) ? origin : 'http://127.0.0.1:4174',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST' || (origin && !LOCAL_ALLOWED_ORIGINS.has(origin))) {
    return new Response(JSON.stringify({ status: 'ERROR', error: 'INVALID_REQUEST' }), { status: 400, headers });
  }
  try {
    const result = await evaluateRelationshipOnServer(await request.json());
    return new Response(JSON.stringify(result), { status: result.status === 'OK' ? 200 : 400, headers });
  } catch {
    return new Response(JSON.stringify({ status: 'ERROR', error: 'SERVER_ERROR' }), { status: 500, headers });
  }
});

