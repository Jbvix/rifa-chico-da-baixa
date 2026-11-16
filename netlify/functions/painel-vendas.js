/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : netlify/functions/painel-vendas.js  (painel SOMENTE LEITURA)
 * Autor    : Jossian Brito
 * Versão   : 3.9.0
 * Data/Hora: 2026-11-16 16:40 (BRT, UTC-3)
 *
 * O QUE FAZ
 *   GET com header "x-painel-chave" → lista de números do sistema de reservas
 *   (store "rifa-state-v2"): nome, telefone, situação e horário.
 *   NÃO altera nada (não libera, não confirma, não cancela).
 *
 * SEGURANÇA
 *   - A chave nunca fica no código: guardamos só SHA-256(chave). Comparação
 *     em tempo constante (timingSafeEqual) sobre os resumos de 32 bytes.
 *     Analogia: é o lacre numerado do porão — conferimos o número do lacre,
 *     sem precisar guardar a chave do cadeado a bordo.
 *   - Revogar: gerar nova chave, trocar CHAVE_SHA256 (ou definir a variável
 *     de ambiente PAINEL_VENDAS_SHA256) e publicar.
 *   - Resposta sem cache (no-store).
 *
 * MODIFICAÇÕES v3.9.0 (2026-11-16)
 *   - Mostra "confirmado" para números com Pix conferido (store separado
 *     "rifa-conferencia", mesma regra de validade da página de administração).
 * MODIFICAÇÕES v3.7.0 (2026-11-16)
 *   - [NOVO] Arquivo criado (painel em tempo real para a Maria José).
 * ========================================================================== */
import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";
import { json } from "../lib/rifa-config.js";
import { conferenciaValida } from "../lib/conferencia.js";

const CHAVE_SHA256 = "32c518327c8f7cf83b1bbc11f3d5c0994e8050b0debff06ad81ebfb900bd61f9";

function autorizado(req) {
  const chave = req.headers.get("x-painel-chave") || "";
  if (chave.length < 20 || chave.length > 200) return false;
  const esperado = Buffer.from(process.env.PAINEL_VENDAS_SHA256 || CHAVE_SHA256, "hex");
  const recebido = createHash("sha256").update(chave).digest();
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Método não permitido" }, 405);
  if (!autorizado(req)) return json({ error: "Link inválido ou expirado" }, 401);

  const estado = (await getStore({ name: "rifa-state-v2", consistency: "strong" })
    .get("state-v2", { type: "json" })) || {};
  const agora = Date.now();
  const conf = (await getStore({ name: "rifa-conferencia", consistency: "strong" }).get("conferidos", { type: "json" })) || { itens: {} };

  // Horários a partir do histórico (audit): reserva criada / pagamento informado.
  const ev = {};
  for (const e of estado.audit || []) {
    if (!e.number) continue;
    const x = (ev[e.number] ||= {});
    if (e.type === "hold_created") { x.reservadoEm = e.at; x.expiraEm = e.expiresAt; x.reserva = e.reservationId; }
    if (e.type === "payment_declared") x.informadoEm = e.at;
  }

  const itens = Object.entries(estado.tickets || {}).map(([numero, t]) => {
    const e = ev[numero] || {};
    let situacao, ordem;
    if (t.payment === "verified" || conferenciaValida(conf.itens?.[numero], t)) { situacao = "confirmado"; ordem = 0; }
    else if (t.payment === "declared") { situacao = "pagamento_informado"; ordem = 1; }
    else if (e.expiraEm && e.expiraEm > agora) { situacao = "reserva_ativa"; ordem = 2; }
    else { situacao = "reserva_expirada"; ordem = 3; }
    return {
      numero,
      nome: String(t.name || "").replace(/\s+/g, " ").trim(),
      telefone: t.phone || "",
      situacao, ordem,
      quando: e.informadoEm || t.legacyOriginal?.date || e.reservadoEm || null,
      expiraEm: situacao === "reserva_ativa" ? e.expiraEm : null,
      legado: !!t.legacySourceKey,
    };
  }).sort((a, b) => a.ordem - b.ordem || String(b.quando).localeCompare(String(a.quando)));

  const pagos = itens.filter((i) => i.ordem <= 1).length;
  return json({
    agora,
    revisao: estado.revision ?? null,
    vendas: estado.salesState || "desconhecido",
    totais: { comprados: pagos, arrecadado: pagos * 20, reservasAtivas: itens.filter((i) => i.ordem === 2).length,
              reservasExpiradas: itens.filter((i) => i.ordem === 3).length, disponiveis: 199 - itens.filter((i) => i.ordem <= 2).length },
    itens,
  });
};
