/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : netlify/functions/sorteio.js  (API pública do sorteio oficial)
 * Autor    : Jossian Brito
 * Versão   : 2.5.0
 * Data/Hora: 2026-11-16 13:00 (BRT, UTC-3)
 *
 * ENDPOINTS
 *   GET  → { agora, fase, agenda, ciclo, gaiolas:[{digito,auditorias}|null ×3],
 *            numero?, ganhador?:{nome, telefoneFinal}|null }
 *          `agora` (relógio do servidor) serve para o navegador sincronizar.
 *          Cada gaiola só aparece a partir do instante da sua animação.
 *   POST { action:"testar-email" }      + header x-admin-token
 *        → envia um e-mail de teste para validar a configuração antes do dia.
 *   POST { action:"status-email" }      + header x-admin-token
 *        → mostra o estado do envio do e-mail do resultado.
 *
 * MODIFICAÇÕES v2.5.0 (2026-11-16)
 *   - [NOVO] Arquivo criado.
 * ========================================================================== */
import { json, lerCorpo, tokenValido } from "../lib/rifa-config.js";
import { agenda, apurar, publico, enviarEmail, garantirEmail, statusEmail } from "../lib/sorteio-core.js";

export default async (req, context) => {
  const ag = agenda();

  if (req.method === "GET") {
    const agora = Date.now();
    const res = await apurar(ag, agora);      // gera/apura só se já for a hora
    // Gatilho de reserva do e-mail (o principal é a função agendada).
    // waitUntil: envia depois de responder, sem atrasar a página.
    if (agora >= ag.fim && res?.apuradoEm) {
      const p = garantirEmail(ag, agora).catch((e) => console.error(e));
      if (context?.waitUntil) context.waitUntil(p); else await p;
    }
    return json(publico(ag, res, Date.now()));
  }

  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  if (!tokenValido(req)) return json({ error: "Não autorizado" }, 403);
  const body = await lerCorpo(req);

  if (body?.action === "testar-email") {
    try {
      const para = await enviarEmail({
        assunto: "Teste – e-mail do resultado da Rifa Solidária",
        texto: "Se você recebeu esta mensagem, o envio automático do resultado está configurado.",
        html: "<p>Se você recebeu esta mensagem, o envio automático do resultado está configurado.</p>",
      });
      return json({ ok: true, para });
    } catch (e) {
      return json({ ok: false, erro: e.message }, 502);
    }
  }
  if (body?.action === "status-email") return json({ email: await statusEmail(ag) });
  return json({ error: "Ação desconhecida" }, 400);
};
