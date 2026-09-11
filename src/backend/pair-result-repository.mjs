import { INVITE_API_URL } from '../relationship-ui/invite-client.mjs';
export function createPairResultRepository({ fetchImpl = fetch, apiUrl = INVITE_API_URL } = {}) {
  return { async getPair(pairId, participantId) { const response = await fetchImpl(apiUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'pair_result',pair_id:pairId,participant_id:participantId})}); const body=await response.json(); if(!response.ok||body.status!=='OK') return null; return body.pair; } };
}
