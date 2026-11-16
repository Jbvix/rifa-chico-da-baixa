import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("rifa-stats");

  if (req.method === "GET") {
    const stats = await store.get("stats", { type: "json" }) || { visits: 0, online: 0, lastPayment: null };
    return Response.json(stats);
  }

  if (req.method === "POST") {
    const body = await req.json();
    const stats = await store.get("stats", { type: "json" }) || { visits: 0, online: 0, lastPayment: null };

    if (body.action === "visit") {
      stats.visits = (stats.visits || 0) + 1;
    }
    if (body.action === "heartbeat") {
      stats.online = Math.max(1, (stats.online || 0));
    }
    if (body.action === "payment") {
      stats.lastPayment = { number: body.number, name: body.name, time: Date.now() };
    }

    await store.setJSON("stats", stats);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Método não permitido" }, { status: 405 });
};