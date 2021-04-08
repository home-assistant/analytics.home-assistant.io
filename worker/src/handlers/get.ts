// Serve JSON to https://analytics.home-assistant.io

import { KV_KEY_CORE_ANALYTICS } from "../data";

export async function handleGet(request: Request): Promise<Response> {
  const core_analytics = await KV.get(KV_KEY_CORE_ANALYTICS);

  return new Response(core_analytics, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
