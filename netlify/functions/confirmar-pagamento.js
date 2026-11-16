/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : netlify/functions/confirmar-pagamento.js  (ADMIN: conferência do Pix)
 * Autor    : Jossian Brito
 * Versão   : 3.9.0
 * Data/Hora: 2026-11-16 18:00 (BRT, UTC-3)
 *
 * ENDPOINTS (header obrigatório "x-admin-chave")
 *   GET  → { versao, itens:[{numero,nome,telefone,pagamento,conferido,…}] }
 *   POST { acao:"verificar"|"desfazer", numero, reservationId, versaoEsperada }
 *
 * PROJETO DE SEGURANÇA (v3.9.0)
 *   A conferência é gravada num armazenamento SEPARADO — store
 *   "rifa-conferencia", chave "conferidos":
 *     { versao, itens: { "007": { reservationId, conferidoEm } }, historico:[…] }
 *   O estado do sistema de reservas (rifa-state-v2) é SOMENTE LIDO. Motivo:
 *   o código-fonte da função de reservas em produção não está disponível, e
 *   um valor novo em "payment" poderia ser tratado como reserva vencida,
 *   liberando o número. Assim o risco para as reservas é zero.
 *   Validade: a conferência só vale enquanto o ticket tiver o MESMO
 *   reservationId e pagamento "declared"/"verified". Se o número for liberado
 *   e recomprado, a conferência antiga perde a validade automaticamente.
 *   Concorrência: versaoEsperada + gravação com onlyIfMatch (ETag).
 *   Analogia: é o diário de bordo do imediato — anota a conferência ao lado,
 *   sem rasurar o livro de cargas do comandante.
 *   Chave: só o SHA-256 no código (ou env ADMIN_CONFIRMAR_SHA256), diferente
 *   da chave do painel de leitura.
 *
 * MODIFICAÇÕES v3.9.0 (2026-11-16)
 *   - [NOVO] Arquivo criado.
 * ========================================================================== */
import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";
import { json, lerCorpo } from "../lib/rifa-config.js";
import { conferenciaValida } from "../lib/conferencia.js";

const CHAVE_SHA256 = "4673f8e7ace4f4cadad24a9d0ebbcd91d12e7032d47370472a2896b955f2b293";
const STORE_ESTADO = "rifa-state-v2", CHAVE_ESTADO = "state-v2";
const STORE_CONF = "rifa-conferencia", CHAVE_CONF = "conferidos";

function autorizado(req) {
  const chave = req.headers.get("x-admin-chave") || "";
  if (chave.length < 20 || chave.length > 200) return false;
  const esperado = Buffer.from(process.env.ADMIN_CONFIRMAR_SHA256 || CHAVE_SHA256, "hex");
  const recebido = createHash("sha256").update(chave).digest();
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}


function listar(estado, conf) {
  const ev = {}, agora = Date.now();
  for (const e of estado.audit || []) {
    if (!e.number) continue;
    const x = (ev[e.number] ||= {});
    if (e.type === "payment_declared") x.informadoEm = e.at;
    if (e.type === "hold_created") { x.reservadoEm = e.at; x.expiraEm = e.expiresAt; }
  }
  return Object.entries(estado.tickets || {}).map(([numero, t]) => {
    const e = ev[numero] || {}, c = conf.itens?.[numero];
    const conferido = conferenciaValida(c, t);
    return {
      numero, reservationId: t.reservationId || null,
      nome: String(t.name || "").replace(/\s+/g, " ").trim(), telefone: t.phone || "",
      pagamento: conferido ? "verified" : t.payment,
      reservaAtiva: t.payment === "not_declared" && e.expiraEm > agora,
      quando: e.informadoEm || t.legacyOriginal?.date || e.reservadoEm || null,
      verificadoEm: conferido ? c.conferidoEm : null,
    };
  }).sort((a, b) => a.numero.localeCompare(b.numero));
}

export default async (req) => {
  if (!autorizado(req)) return json({ error: "Link inválido ou expirado" }, 401);
  const estado = (await getStore({ name: STORE_ESTADO, consistency: "strong" }).get(CHAVE_ESTADO, { type: "json" })) || {};
  const lojaConf = getStore({ name: STORE_CONF, consistency: "strong" });

  if (req.method === "GET") {
    const conf = (await lojaConf.get(CHAVE_CONF, { type: "json" })) || { versao: 0, itens: {} };
    return json({ agora: Date.now(), versao: conf.versao || 0, revisao: estado.revision ?? null, itens: listar(estado, conf) });
  }
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const b = await lerCorpo(req);
  const acao = b?.acao, numero = String(b?.numero || "");
  if (!["verificar", "desfazer"].includes(acao) || !/^\d{3}$/.test(numero)) return json({ error: "Pedido inválido" }, 400);
  const t = estado.tickets?.[numero];
  if (!t) return json({ error: "Número sem registro" }, 404);
  if ((t.reservationId || null) !== (b.reservationId || null)) return json({ error: "A reserva deste número mudou. Toque em Atualizar." }, 409);
  if (t.payment !== "declared" && t.payment !== "verified") return json({ error: "Este número não está com pagamento informado." }, 409);

  const atual = await lojaConf.getWithMetadata(CHAVE_CONF, { type: "json" });
  const conf = atual?.data || { versao: 0, itens: {}, historico: [] };
  if ((b.versaoEsperada ?? 0) !== (conf.versao || 0)) return json({ error: "Os dados mudaram. Toque em Atualizar e tente de novo.", versao: conf.versao }, 409);
  const ja = conferenciaValida(conf.itens?.[numero], t);
  if (acao === "verificar" && ja) return json({ error: "Este número já está conferido." }, 409);
  if (acao === "desfazer" && !ja) return json({ error: "Este número não está conferido." }, 409);

  const agoraIso = new Date().toISOString();
  conf.itens ||= {}; conf.historico ||= [];
  if (acao === "verificar") conf.itens[numero] = { reservationId: t.reservationId || null, conferidoEm: agoraIso };
  else delete conf.itens[numero];
  conf.versao = (conf.versao || 0) + 1;
  conf.historico.push({ tipo: acao === "verificar" ? "pix_conferido" : "conferencia_desfeita", numero, reservationId: t.reservationId || null, em: agoraIso, versao: conf.versao });

  const w = await lojaConf.setJSON(CHAVE_CONF, conf, atual?.etag ? { onlyIfMatch: atual.etag } : { onlyIfNew: true });
  if (w?.modified === false) return json({ error: "Outra alteração aconteceu agora. Toque em Atualizar e tente de novo." }, 409);
  return json({ ok: true, numero, pagamento: acao === "verificar" ? "verified" : "declared", versao: conf.versao });
};
