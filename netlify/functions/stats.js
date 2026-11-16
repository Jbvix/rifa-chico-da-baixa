/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : netlify/functions/stats.js  (visitas, online, último pagamento)
 * Autor    : Jossian Brito
 * Versão   : 2.0.0
 * Data/Hora: 2026-11-16 09:48 (BRT, UTC-3)
 *
 * ENDPOINTS
 *   GET  → { visits, online, lastPayment }
 *   POST { action:"visit" }              → +1 visita (cliente envia 1×/sessão)
 *   POST { action:"heartbeat", sid }     → marca a sessão como presente
 *   POST { action:"leave", sid }         → remove a sessão (aba fechada)
 *   Todos os POST devolvem o mesmo objeto do GET (economiza uma ida à rede).
 *
 * POR QUE OS CONTADORES NÃO ATUALIZAVAM (diagnóstico da v1.x)
 *   1. "online" era calculado como Math.max(1, online): nunca somava nem
 *      subtraía nada → ficava preso em 1 para sempre.
 *   2. visitas, online e lastPayment moravam no MESMO blob "stats". Cada
 *      heartbeat (a cada 8 s, por visitante) lia e regravava o objeto
 *      inteiro, sobrescrevendo visitas recém-somadas (lost update).
 *   3. Leitura em consistência eventual (padrão): o GET podia devolver um
 *      valor de até ~60 s atrás.
 *
 * MODELO NOVO (presença por "batida de coração")
 *   presence = { sid: timestampMs }. Online = nº de sids com
 *   agora − timestamp < ONLINE_TTL_MS (45 s). É o mesmo raciocínio do AIS:
 *   um navio só aparece na tela enquanto continua transmitindo posição.
 *
 * MODIFICAÇÕES v2.0.0 (2026-11-16)
 *   - [BUG] Contador "online" real (presença com TTL) — itens 1 e 3 acima.
 *   - [BUG] Chaves separadas: "visits", "presence", "lastPayment" — item 2.
 *   - [BUG] Escritas atômicas (CAS por ETag) e consistency:"strong".
 *   - [MIGRAÇÃO] Se "visits" ainda não existir, herda stats.visits da v1.x.
 *   - [SEGURANÇA] action "payment" removida: o servidor de números é quem
 *     registra o pagamento; o cliente não pode mais disparar o sino falso.
 * ========================================================================== */
import { getStore } from "@netlify/blobs";
import { ONLINE_TTL_MS, atualizarJSON, json, lerCorpo } from "../lib/rifa-config.js";

const SID_VALIDO = /^[a-zA-Z0-9-]{8,64}$/;

// Remove sessões que pararam de "bater" há mais de ONLINE_TTL_MS.
function podar(presenca, agora) {
  for (const [sid, t] of Object.entries(presenca)) {
    if (agora - t > ONLINE_TTL_MS) delete presenca[sid];
  }
  return presenca;
}

async function lerVisitas(store) {
  const atual = await store.get("visits", { type: "json" });
  if (atual) return atual.count || 0;
  // Migração: valor herdado do blob único da v1.x.
  const legado = await store.get("stats", { type: "json" });
  return legado?.visits || 0;
}

async function retrato(store) {
  const agora = Date.now();
  const [visits, presenca, lastPayment] = await Promise.all([
    lerVisitas(store),
    store.get("presence", { type: "json" }),
    store.get("lastPayment", { type: "json" }),
  ]);
  const online = Object.values(presenca || {}).filter((t) => agora - t <= ONLINE_TTL_MS).length;
  return { visits, online: Math.max(1, online), lastPayment: lastPayment || null };
}

export default async (req) => {
  const store = getStore({ name: "rifa-stats", consistency: "strong" });

  if (req.method === "GET") return json(await retrato(store));
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const body = await lerCorpo(req);
  if (!body) return json({ error: "JSON inválido" }, 400);

  if (body.action === "visit") {
    const base = await lerVisitas(store); // usado só na 1ª criação da chave
    await atualizarJSON(store, "visits", (v) => ({ valor: { count: (v.count ?? base) + 1 } }), {});
  } else if (body.action === "heartbeat" || body.action === "leave") {
    if (!SID_VALIDO.test(String(body.sid || ""))) return json({ error: "sid inválido" }, 400);
    await atualizarJSON(store, "presence", (p) => {
      const agora = Date.now();
      podar(p, agora);
      if (body.action === "heartbeat") p[body.sid] = agora;
      else delete p[body.sid];
      return { valor: p };
    }, {});
  } else {
    return json({ error: "Ação desconhecida" }, 400);
  }

  return json(await retrato(store));
};
