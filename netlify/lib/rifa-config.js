/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : netlify/lib/rifa-config.js
 * Autor    : Jossian Brito
 * Versão   : 2.0.0
 * Data/Hora: 2026-11-16 09:48 (BRT, UTC-3)
 *
 * PROPÓSITO
 *   "Carta náutica" única da rifa: todas as constantes que o backend usa
 *   ficam aqui, para que numeros.js e stats.js naveguem pelo mesmo rumo.
 *
 * MODIFICAÇÕES v2.0.0 (2026-11-16)
 *   - [NOVO] Total oficial corrigido para 199 números (001–199). A versão 1.x
 *     usava 200 (laço 1..200) e anunciava "000 a 200" (= 201 bilhetes).
 *   - [NOVO] Funções utilitárias de validação (número, nome, telefone).
 *   - [NOVO] Helper de escrita atômica (Compare-And-Swap) por ETag.
 * ========================================================================== */

// Quantidade de bilhetes à venda. Faixa válida: 1 ≤ n ≤ TOTAL_NUMEROS.
export const TOTAL_NUMEROS = 199;

// Um usuário é considerado "online" se mandou heartbeat nos últimos 45 s.
// Com heartbeat a cada 15 s o cliente precisa perder 3 batidas seguidas
// para "cair" — igual a um VHF que só considera o rebocador fora da escuta
// após três chamadas sem resposta.
export const ONLINE_TTL_MS = 45_000;

// Primeiro nome, para exibição pública (LGPD: telefone nunca sai do servidor).
export function primeiroNome(nome) {
  return String(nome || "").trim().split(/\s+/)[0] || "Comprador";
}

// Número inteiro dentro da faixa 1..TOTAL_NUMEROS, ou null.
export function validarNumero(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_NUMEROS ? n : null;
}

// Nome: 3 a 80 caracteres após normalizar espaços.
export function validarNome(valor) {
  const nome = String(valor || "").replace(/\s+/g, " ").trim();
  return nome.length >= 3 && nome.length <= 80 ? nome : null;
}

// Telefone: somente dígitos; aceita de 10 (DDD+fixo) a 13 (55+DDD+celular).
export function validarTelefone(valor) {
  const tel = String(valor || "").replace(/\D/g, "");
  return tel.length >= 10 && tel.length <= 13 ? tel : null;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * atualizarJSON — escrita atômica otimista (Compare-And-Swap).
 *
 * Por que existe: na v1.x cada função fazia "ler → alterar → gravar". Com
 * dois acessos simultâneos o último a gravar apagava o trabalho do primeiro
 * (lost update). Era exatamente isso que congelava o contador de visitas:
 * o heartbeat regravava o objeto inteiro com o valor antigo.
 *
 * Como funciona: lê o blob junto com sua ETag (a "impressão digital" da
 * versão). Grava com onlyIfMatch=ETag; se outro processo gravou antes, a
 * ETag mudou, o Blobs devolve modified:false e tentamos de novo.
 * Analogia: dois rebocadores no mesmo cabo — antes de dar máquina, cada
 * comandante confirma no rádio que a tensão no cabo é a mesma que ele leu.
 *
 * Backoff: espera aleatória de 0–(40·tentativa) ms, para os concorrentes não
 * colidirem de novo no mesmo instante.
 *
 * @param store     Store do Netlify Blobs (consistency "strong")
 * @param chave     chave do blob
 * @param mutador   (valorAtual) => { valor, resultado } | { abortar }
 * @param padrao    valor inicial se o blob não existir
 * @returns         { ok:true, resultado } | { ok:false, abortar } | { ok:false, conflito:true }
 */
export async function atualizarJSON(store, chave, mutador, padrao, tentativas = 6) {
  for (let i = 1; i <= tentativas; i++) {
    const atual = await store.getWithMetadata(chave, { type: "json" });
    const valorAtual = atual?.data ?? structuredClone(padrao);
    const saida = await mutador(valorAtual);
    if (saida.abortar) return { ok: false, abortar: saida.abortar };

    const opcoes = atual?.etag ? { onlyIfMatch: atual.etag } : { onlyIfNew: true };
    const res = await store.setJSON(chave, saida.valor, opcoes);
    // modified === false → outro processo gravou primeiro: tenta de novo.
    if (res?.modified !== false) return { ok: true, resultado: saida.resultado };
    await espera(Math.random() * 40 * i);
  }
  return { ok: false, conflito: true };
}

// Resposta JSON sem cache (dados "ao vivo" nunca podem ficar presos na CDN).
export function json(dados, status = 200) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

// Lê o corpo como texto e faz parse (aceita sendBeacon, que envia text/plain).
export async function lerCorpo(req) {
  try {
    return JSON.parse(await req.text());
  } catch {
    return null;
  }
}
