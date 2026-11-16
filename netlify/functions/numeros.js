/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : netlify/functions/numeros.js  (API da cartela)
 * Autor    : Jossian Brito
 * Versão   : 2.5.0
 * Data/Hora: 2026-11-16 13:00 (BRT, UTC-3)
 *
 * ENDPOINTS
 *   GET  /.netlify/functions/numeros
 *        → { total, sold: { "7": { name:"Ana", date }, ... }, foraDaFaixa:[...] }
 *          Apenas o PRIMEIRO NOME é público. Telefone nunca sai do servidor.
 *   POST /.netlify/functions/numeros   { number, name, phone }
 *        → 200 { ok, number, name } | 400 dados inválidos | 409 já escolhido
 *   POST { action:"clear" } + header x-admin-token = env RIFA_ADMIN_TOKEN
 *        → libera todos os números (desabilitado se a variável não existir).
 *
 * MODIFICAÇÕES v2.5.0 (2026-11-16)
 *   - [REGRA] Vendas encerradas no início do sorteio (23/12/2026 09:55 BRT):
 *     POST de compra devolve 423. Sem isso, alguém poderia comprar depois
 *     de ver a centena revelada às 09:59:40.
 *   - [NOVO] GET informa `vendasEncerradas`.
 *
 * MODIFICAÇÕES v2.0.0 (2026-11-16)
 *   - [CRÍTICO] "clear" era público: qualquer pessoa apagava a rifa com um
 *     POST. Agora exige token de administrador (env RIFA_ADMIN_TOKEN).
 *   - [CRÍTICO/LGPD] GET devolvia nome completo + telefone de todos os
 *     compradores. Agora devolve só o primeiro nome.
 *   - [BUG] Escrita "ler→alterar→gravar" perdia reservas simultâneas.
 *     Agora usa Compare-And-Swap por ETag (ver lib/rifa-config.js).
 *   - [BUG] Leituras "eventual consistency" (padrão do Blobs) podiam ficar
 *     até ~60 s atrasadas → cartela e contadores pareciam congelados.
 *     Agora consistency:"strong".
 *   - [BUG] Faixa não era validada (aceitava 0, 200, 99999, "abc").
 *     Agora 1..199. Registros legados fora da faixa são preservados e
 *     sinalizados em `foraDaFaixa` para a organização resolver.
 *   - [NOVO] O aviso de "novo pagamento" (sino) é gravado pelo servidor no
 *     momento da reserva; antes o cliente podia forjá-lo.
 * ========================================================================== */
import { getStore } from "@netlify/blobs";
import {
  TOTAL_NUMEROS, primeiroNome, validarNumero, validarNome, validarTelefone,
  atualizarJSON, json, lerCorpo, tokenValido,
} from "../lib/rifa-config.js";
import { agenda } from "../lib/sorteio-core.js";

// Mesma store e mesma chave da v1.x → os registros existentes são mantidos.
const STORE_NUMEROS = "rifa-numeros";
const CHAVE_VENDIDOS = "sold";

export default async (req) => {
  const store = getStore({ name: STORE_NUMEROS, consistency: "strong" });

  if (req.method === "GET") {
    const vendidos = (await store.get(CHAVE_VENDIDOS, { type: "json" })) || {};
    const publico = {};
    const foraDaFaixa = [];
    for (const [num, reg] of Object.entries(vendidos)) {
      publico[num] = { name: primeiroNome(reg?.name), date: reg?.date || null };
      if (!validarNumero(num)) foraDaFaixa.push(Number(num) || num);
    }
    return json({ total: TOTAL_NUMEROS, sold: publico, foraDaFaixa,
                  vendasEncerradas: Date.now() >= agenda().inicio });
  }

  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const body = await lerCorpo(req);
  if (!body) return json({ error: "JSON inválido" }, 400);

  if (body.action === "clear") {
    if (!tokenValido(req)) return json({ error: "Não autorizado" }, 403);
    await store.setJSON(CHAVE_VENDIDOS, {});
    return json({ ok: true, message: "Todos os números liberados" });
  }

  // Vendas fecham quando as gaiolas começam a girar (fonte de verdade: servidor).
  if (Date.now() >= agenda().inicio) {
    return json({ error: "Vendas encerradas: o sorteio já começou." }, 423);
  }

  const number = validarNumero(body.number);
  const name = validarNome(body.name);
  const phone = validarTelefone(body.phone);
  if (!number) return json({ error: `Número inválido (1 a ${TOTAL_NUMEROS})` }, 400);
  if (!name) return json({ error: "Informe o nome completo (mínimo 3 letras)" }, 400);
  if (!phone) return json({ error: "Informe um WhatsApp válido com DDD" }, 400);

  const resultado = await atualizarJSON(store, CHAVE_VENDIDOS, (vendidos) => {
    if (vendidos[number]) return { abortar: "ocupado" };
    vendidos[number] = { name, phone, date: new Date().toISOString() };
    return { valor: vendidos };
  }, {});

  if (resultado.abortar) return json({ error: "Número já escolhido" }, 409);
  if (!resultado.ok) return json({ error: "Muitos acessos ao mesmo tempo. Tente novamente." }, 503);

  // Sinal para o "sino" dos outros visitantes (gravação simples: o último vence).
  const stats = getStore({ name: "rifa-stats", consistency: "strong" });
  await stats.setJSON("lastPayment", { number, name: primeiroNome(name), time: Date.now() });

  return json({ ok: true, number, name: primeiroNome(name) });
};
