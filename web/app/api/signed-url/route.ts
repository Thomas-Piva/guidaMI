// GET /api/signed-url -> {signedUrl} | 503 {error:"missing_keys"} | 502 {error}
// The ElevenLabs key never reaches the browser: the client only gets a short-lived signed WebSocket URL.
import { connection } from "next/server";

export async function GET() {
  await connection(); // always at request time, never prerendered
  const key = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!key || !agentId) return Response.json({ error: "missing_keys" }, { status: 503 });

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": key }, cache: "no-store" },
    );
    if (!res.ok) {
      console.error("signed-url: ElevenLabs answered", res.status, await res.text().catch(() => ""));
      return Response.json({ error: "elevenlabs_error", status: res.status }, { status: 502 });
    }
    const { signed_url } = (await res.json()) as { signed_url?: string };
    if (!signed_url) return Response.json({ error: "elevenlabs_error" }, { status: 502 });
    return Response.json({ signedUrl: signed_url }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("signed-url: fetch failed", e);
    return Response.json({ error: "elevenlabs_unreachable" }, { status: 502 });
  }
}
