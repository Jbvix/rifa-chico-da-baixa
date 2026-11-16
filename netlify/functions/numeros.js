import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("rifa-numeros");

  if (req.method === "GET") {
    const data = await store.get("sold", { type: "json" }) || {};
    return Response.json(data);
  }

  if (req.method === "POST") {
    const body = await req.json();

    if (body.action === "clear") {
      await store.setJSON("sold", {});
      return Response.json({ ok: true, message: "Todos os números liberados" });
    }

    const { number, name, phone } = body;
    if (!number || !name || !phone) {
      return Response.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const sold = await store.get("sold", { type: "json" }) || {};
    if (sold[number]) {
      return Response.json({ error: "Número já escolhido" }, { status: 409 });
    }

    sold[number] = { name, phone, date: new Date().toISOString() };
    await store.setJSON("sold", sold);

    return Response.json({ ok: true, number, name });
  }

  return Response.json({ error: "Método não permitido" }, { status: 405 });
};