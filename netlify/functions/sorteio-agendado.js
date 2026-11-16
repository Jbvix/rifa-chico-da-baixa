/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : netlify/functions/sorteio-agendado.js  (Scheduled Function)
 * Autor    : Jossian Brito
 * Versão   : 2.5.0
 * Data/Hora: 2026-11-16 13:00 (BRT, UTC-3)
 *
 * O QUE FAZ
 *   Roda a cada minuto de 10:00 a 10:10 (BRT) do dia 23/12, garante que o
 *   resultado foi gerado e apurado e envia o e-mail de confirmação, mesmo
 *   que ninguém esteja com a página aberta. Rodar várias vezes é seguro:
 *   garantirEmail() só envia uma vez (as demais execuções encontram
 *   "enviado" e param). Se a primeira tentativa falhar, a próxima tenta de novo.
 *
 * CRON (sempre em UTC): "0-10 13 23 12 *"
 *   minuto 0–10, 13 h UTC (= 10 h BRT), dia 23, dezembro, qualquer dia da semana.
 *   Observação: funções agendadas só rodam no deploy de PRODUÇÃO publicado.
 *
 * MODIFICAÇÕES v2.5.0 (2026-11-16)
 *   - [NOVO] Arquivo criado.
 * ========================================================================== */
import { agenda, garantirEmail } from "../lib/sorteio-core.js";

export default async () => {
  const ag = agenda();
  if (Date.now() < ag.fim) return new Response("antes do horário");
  const r = await garantirEmail(ag);
  console.log("sorteio-agendado:", JSON.stringify(r));
  return new Response(JSON.stringify(r));
};

export const config = { schedule: "0-10 13 23 12 *" };
