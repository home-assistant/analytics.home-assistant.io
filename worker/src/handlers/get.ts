// Serve JSON to https://analytics.home-assistant.io

export async function handleGet(request: Request): Promise<Response> {
  const core_analytics = await KV.get("core_analytics");

  return new Response(core_analytics, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
