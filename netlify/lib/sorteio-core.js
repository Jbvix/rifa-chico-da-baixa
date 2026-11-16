/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : netlify/lib/sorteio-core.js  (núcleo do SORTEIO OFICIAL)
 * Autor    : Jossian Brito
 * Versão   : 2.6.0
 * Data/Hora: 2026-11-16 11:10 (BRT, UTC-3)
 *
 * CRONOGRAMA OFICIAL (horário de Brasília, UTC−3)
 *   23/12/2026 09:55:00  gaiolas começam a girar  (vendas encerradas)
 *   23/12/2026 09:59:40  1ª gaiola (centena) revela
 *   23/12/2026 09:59:50  2ª gaiola (dezena)  revela
 *   23/12/2026 10:00:00  3ª gaiola (unidade) revela → resultado final
 *   Tudo é derivado de T3 (10:00:00 BRT = 13:00:00 UTC):
 *     inicio = T3 − 300 s ; T1 = T3 − 20 s ; T2 = T3 − 10 s
 *   Para ensaio em deploy de teste: variável de ambiente SORTEIO_T3 (ISO 8601).
 *
 * PRINCÍPIOS
 *   1. Um único resultado para todos: gerado UMA vez no servidor, gravado com
 *      onlyIfNew (se dois acessos chegarem juntos, só o primeiro grava; o
 *      segundo lê o que o primeiro gravou).
 *   2. Imprevisível até a hora: o número só é gerado ~10 s antes de T1 e cada
 *      gaiola só é liberada no instante em que a animação dela começa.
 *   3. Vendas fecham em `inicio`, antes de qualquer dígito existir.
 *
 * TEMPO DA ANIMAÇÃO DE CADA GAIOLA (o cliente segue exatamente isto)
 *   Cada bola de auditoria consome um ciclo de 4,0 s:
 *     frear 0,9 s → extrair 0,9 s → exibir 1,0 s → girar de novo 1,2 s
 *   A extração final consome 1,8 s: frear 0,9 s → extrair 0,9 s.
 *   Logo a gaiola i começa a ser animada em
 *     S_i = T_i − (1,8 s + 4,0 s · a_i)        a_i = nº de auditorias
 *   Com a_i ≤ 2: S_i ≥ T_i − 9,8 s > T_(i−1)  → nunca atropela a gaiola anterior.
 *
 * MODIFICAÇÕES v2.6.0 (2026-11-16)
 *   - [PRODUÇÃO] Apuração lê o sistema de reservas em produção:
 *     store "rifa-state-v2", chave "state-v2", tickets["007"] =
 *     { name, phone, payment: "declared" | "verified" | "not_declared", ... }.
 *     Só conta como comprado: payment "declared" ou "verified".
 *     Reserva sem pagamento informado ("not_declared") NÃO concorre.
 *
 * MODIFICAÇÕES v2.5.0 (2026-11-16)
 *   - [NOVO] Arquivo criado: agenda, geração, liberação progressiva,
 *     apuração do ganhador e envio de e-mail idempotente.
 * ========================================================================== */
import { getStore } from "@netlify/blobs";
import { randomInt } from "node:crypto";
import { TOTAL_NUMEROS, atualizarJSON } from "./rifa-config.js";

// 23/12/2026 10:00:00 BRT (UTC−3) = 13:00:00 UTC
const T3_PADRAO = "2026-12-23T13:00:00Z";

export const AUD_MAX = 2;               // auditorias máximas por gaiola no sorteio oficial
export const CICLO_AUD_MS = 4000;       // duração de 1 ciclo de auditoria
export const EXTRACAO_MS = 1800;        // frear + extrair a bola final
// Gera o resultado 10 s antes de T1 (= maior antecedência possível de liberação).
const GERAR_ANTES_MS = EXTRACAO_MS + CICLO_AUD_MS * AUD_MAX + 200;

export const EMAIL_PADRAO = "jannatulipa@hotmail.com";

const loja = () => getStore({ name: "rifa-sorteio", consistency: "strong" });

export function agenda() {
  const fim = Date.parse(process.env.SORTEIO_T3 || T3_PADRAO);
  return { inicio: fim - 300_000, t: [fim - 20_000, fim - 10_000, fim], fim };
}

// Instante em que a gaiola i pode ser revelada ao público (início da animação dela).
export function liberacao(ag, auditorias, i) {
  return ag.t[i] - (EXTRACAO_MS + CICLO_AUD_MS * auditorias[i]);
}

// Chave por data: um ensaio com SORTEIO_T3 diferente nunca colide com o oficial.
const chave = (ag, nome) => `${nome}-${new Date(ag.fim).toISOString()}`;

/* Auditorias de uma gaiola com k bolas de dígito + 1 de auditoria.
 *   P(sair auditoria em uma extração) = 1/(k+1)
 *   randomInt(k+1) devolve 0..k uniforme (crypto, sem viés de módulo);
 *   o valor k representa a bola de auditoria.
 * O limite AUD_MAX só encurta a encenação; não toca no número sorteado. */
function contarAuditorias(k) {
  let a = 0;
  while (a < AUD_MAX && randomInt(k + 1) === k) a++;
  return a;
}

/* Gera (se ainda não existe e já está na hora) e devolve o resultado gravado.
 * numero = randomInt(1, TOTAL+1) → uniforme exato em 1..199. */
export async function obterResultado(ag, agora) {
  const store = loja();
  const k = chave(ag, "resultado");
  let res = await store.get(k, { type: "json" });
  if (res || agora < ag.t[0] - GERAR_ANTES_MS) return res;

  const numero = randomInt(1, TOTAL_NUMEROS + 1);
  const novo = {
    numero,
    digitos: String(numero).padStart(3, "0").split("").map(Number),
    auditorias: [contarAuditorias(2), contarAuditorias(10), contarAuditorias(10)],
    geradoEm: new Date(agora).toISOString(),
    agendaFim: new Date(ag.fim).toISOString(),
  };
  const w = await store.setJSON(k, novo, { onlyIfNew: true });
  if (w?.modified === false) return store.get(k, { type: "json" }); // outro acesso gerou antes
  return novo;
}

/* Após T3: grava quem ganhou (uma vez). Lê a cartela no momento da apuração. */
export async function apurar(ag, agora) {
  const res = await obterResultado(ag, agora);
  if (!res || agora < ag.fim || res.apuradoEm) return res;
  const estado = (await getStore({ name: "rifa-state-v2", consistency: "strong" })
    .get("state-v2", { type: "json" })) || {};
  const tickets = estado.tickets || {};
  const pago = (t) => t && (t.payment === "declared" || t.payment === "verified");
  const comprados = Object.values(tickets).filter(pago);
  const t = tickets[String(res.numero).padStart(3, "0")];
  const reg = pago(t) ? { name: String(t.name || "").replace(/\s+/g, " ").trim(), phone: t.phone } : null;
  const r = await atualizarJSON(loja(), chave(ag, "resultado"), (atual) => {
    if (atual.apuradoEm) return { abortar: "ja-apurado" };
    atual.apuradoEm = new Date(agora).toISOString();
    atual.totalVendidos = comprados.length;
    const digitos = String(reg?.phone || "").replace(/\D/g, "");
    atual.ganhador = reg
      ? { nome: reg.name, telefone: reg.phone || "", telefoneFinal: digitos.slice(-4) }
      : null;
    return { valor: atual, resultado: atual };
  }, res);
  return r.ok ? r.resultado : loja().get(chave(ag, "resultado"), { type: "json" });
}

/* Versão pública: só o que já pode ser mostrado neste instante. */
export function publico(ag, res, agora) {
  const fase = agora < ag.inicio ? "aguardando" : agora < ag.fim ? "ao-vivo" : "encerrado";
  const out = {
    agora, fase,
    agenda: { inicio: ag.inicio, t: ag.t, fim: ag.fim },
    ciclo: { auditoriaMs: CICLO_AUD_MS, extracaoMs: EXTRACAO_MS },
    gaiolas: [null, null, null],
  };
  if (!res) return out;
  for (let i = 0; i < 3; i++) {
    if (agora >= liberacao(ag, res.auditorias, i)) {
      out.gaiolas[i] = { digito: res.digitos[i], auditorias: res.auditorias[i] };
    }
  }
  if (agora >= ag.fim && res.apuradoEm) {
    out.numero = res.numero;
    out.ganhador = res.ganhador
      ? { nome: res.ganhador.nome, telefoneFinal: res.ganhador.telefoneFinal }
      : null;                                   // null = número não comprado
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * E-MAIL
 *   Provedores suportados (configure UM no Netlify → Environment variables):
 *     RESEND_API_KEY   + EMAIL_REMETENTE  (ex.: "Rifa <rifa@seudominio.com.br>")
 *     SENDGRID_API_KEY + EMAIL_REMETENTE  (remetente verificado no SendGrid)
 *   Destinatário: EMAIL_RESULTADO (padrão: jannatulipa@hotmail.com)
 * ------------------------------------------------------------------------- */
export async function enviarEmail({ assunto, texto, html }) {
  const para = process.env.EMAIL_RESULTADO || EMAIL_PADRAO;
  const de = process.env.EMAIL_REMETENTE;
  if (!de) throw new Error("EMAIL_REMETENTE não configurado");
  let r;
  if (process.env.RESEND_API_KEY) {
    r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: de, to: [para], subject: assunto, text: texto, html }),
    });
  } else if (process.env.SENDGRID_API_KEY) {
    r = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: para }] }],
        from: { email: de.replace(/^.*<|>.*$/g, "") },
        subject: assunto,
        content: [{ type: "text/plain", value: texto }, { type: "text/html", value: html }],
      }),
    });
  } else {
    throw new Error("Nenhum provedor de e-mail configurado (RESEND_API_KEY ou SENDGRID_API_KEY)");
  }
  if (!r.ok) throw new Error(`Provedor respondeu HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return para;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const horaBR = (iso) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export function montarEmail(res) {
  const n = String(res.numero).padStart(3, "0");
  const g = res.ganhador;
  const linhaGanhador = g
    ? `Ganhador(a): ${g.nome}\nTelefone: ${g.telefone} (final ${g.telefoneFinal})`
    : "Número NÃO comprado — sem ganhador nesta extração.";
  const aud = res.auditorias;
  const texto = [
    "RIFA SOLIDÁRIA – Sr. Francisco Felício (Chico da Baixa)",
    "Confirmação do resultado do sorteio oficial",
    "",
    `Número sorteado: ${n}`,
    linhaGanhador,
    "",
    `Data/hora do resultado: ${horaBR(res.agendaFim)} (horário de Brasília)`,
    `Número gerado pelo servidor em: ${horaBR(res.geradoEm)}`,
    `Apurado em: ${horaBR(res.apuradoEm)}`,
    `Bolas de auditoria: centena ${aud[0]}, dezena ${aud[1]}, unidade ${aud[2]}`,
    `Números comprados no fechamento: ${res.totalVendidos}`,
    "",
    "Mensagem automática enviada pelo sistema da rifa.",
  ].join("\n");
  const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px">
<h2 style="color:#006B3F;margin:0 0 4px">Rifa Solidária – Chico da Baixa</h2>
<p style="margin:0 0 16px;color:#555">Confirmação do resultado do sorteio oficial</p>
<p style="font-size:42px;font-weight:800;margin:0;color:#0b2b1c">${n}</p>
${g ? `<p style="font-size:18px"><b>Ganhador(a):</b> ${esc(g.nome)}<br><b>Telefone:</b> ${esc(g.telefone)} (final ${esc(g.telefoneFinal)})</p>`
    : `<p style="font-size:18px;color:#C8102E"><b>Número não comprado — sem ganhador nesta extração.</b></p>`}
<table style="font-size:14px;color:#333;border-collapse:collapse">
<tr><td style="padding:2px 12px 2px 0">Resultado</td><td>${esc(horaBR(res.agendaFim))} (Brasília)</td></tr>
<tr><td style="padding:2px 12px 2px 0">Gerado em</td><td>${esc(horaBR(res.geradoEm))}</td></tr>
<tr><td style="padding:2px 12px 2px 0">Apurado em</td><td>${esc(horaBR(res.apuradoEm))}</td></tr>
<tr><td style="padding:2px 12px 2px 0">Auditorias</td><td>centena ${aud[0]}, dezena ${aud[1]}, unidade ${aud[2]}</td></tr>
<tr><td style="padding:2px 12px 2px 0">Comprados</td><td>${res.totalVendidos}</td></tr>
</table>
<p style="font-size:12px;color:#888;margin-top:16px">Mensagem automática enviada pelo sistema da rifa.</p></div>`;
  const assunto = `Resultado da Rifa Solidária: número ${n}` + (g ? ` — ${g.nome}` : " — não comprado");
  return { assunto, texto, html };
}

/* Envia o e-mail do resultado UMA vez, mesmo com vários gatilhos ao mesmo
 * tempo (função agendada + acessos à página). Quem "reserva" o envio via CAS
 * é o único que envia. Se falhar, outro gatilho pode tentar de novo depois de
 * 2 minutos. */
export async function garantirEmail(ag, agora = Date.now()) {
  const res = await apurar(ag, agora);
  if (!res?.apuradoEm) return { status: "aguardando-apuracao" };
  const store = loja();
  const k = chave(ag, "email");
  const reserva = await atualizarJSON(store, k, (e) => {
    if (e.status === "enviado") return { abortar: "enviado" };
    if (e.status === "enviando" && agora - e.em < 120_000) return { abortar: "em-andamento" };
    return { valor: { status: "enviando", em: agora, tentativas: (e.tentativas || 0) + 1 } };
  }, {});
  if (!reserva.ok) return { status: reserva.abortar || "conflito" };
  try {
    const para = await enviarEmail(montarEmail(res));
    await store.setJSON(k, { status: "enviado", em: Date.now(), para });
    return { status: "enviado" };
  } catch (e) {
    await store.setJSON(k, { status: "erro", em: Date.now(), erro: String(e.message).slice(0, 300) });
    console.error("Falha no e-mail do resultado:", e);
    return { status: "erro", erro: e.message };
  }
}

export async function statusEmail(ag) {
  return loja().get(chave(ag, "email"), { type: "json" });
}
