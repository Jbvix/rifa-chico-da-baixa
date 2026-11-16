/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : netlify/lib/conferencia.js
 * Autor    : Jossian Brito · Versão 3.9.0 · 2026-11-16 18:30 (BRT)
 * Regra única de validade da conferência do Pix (store "rifa-conferencia"):
 *   vale se o ticket atual tem o MESMO reservationId registrado na conferência
 *   e pagamento "declared"/"verified". Liberou e recomprou → não vale mais.
 * MODIFICAÇÕES v3.9.0: arquivo criado.
 * ========================================================================== */
export function conferenciaValida(conf, t) {
  return !!(conf && t && conf.reservationId === (t.reservationId || null) && (t.payment === "declared" || t.payment === "verified"));
}
