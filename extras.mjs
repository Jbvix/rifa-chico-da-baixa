/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : extras.mjs (complementos da página principal em produção)
 * Autor    : Jossian Brito
 * Versão   : 3.8.0
 * Data/Hora: 2026-11-16 11:10 (BRT, UTC-3)
 *
 * O QUE FAZ (sem alterar o fluxo de reserva do live-client.mjs)
 *   1. ONLINE / VISITAS — cada aba tem um sid aleatório (sessionStorage):
 *        visita    : 1× por sessão de navegador
 *        heartbeat : a cada 15 s (aba visível) → online = abas com sinal
 *                    nos últimos 45 s (3 batidas), calculado no servidor
 *        leave     : sendBeacon quando a aba fica oculta ou é fechada
 *      Analogia: o AIS — o navio só aparece no radar enquanto transmite.
 *   2. SORTEIO — lê /.netlify/functions/sorteio: data oficial, número
 *      sorteado e ganhador (nome + 4 últimos dígitos do telefone).
 *   3. COMPRAS ENCERRADAS — a partir das 09:50 de 23/12 (v3.5.0) a cartela deixa de
 *      aceitar cliques (bloqueio visual; o encerramento definitivo das vendas
 *      é feito no painel administrativo).
 *
 * MODIFICAÇÕES v3.8.0 (2026-11-16)
 *   - v3.10.0: aviso "Role para baixo" some ao chegar à cartela ou após 10 s.
 *   - [NOVO] Compartilhar: Web Share API (folha nativa do celular); sem ela,
 *     mini-menu com WhatsApp e "Copiar link".
 * MODIFICAÇÕES v2.6.0 (2026-11-16)
 *   - [NOVO] Arquivo criado (a CSP do site exige scripts em arquivos próprios).
 * ========================================================================== */
const API_STATS = '/.netlify/functions/stats';
const API_SORTEIO = '/.netlify/functions/sorteio';
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(3, '0');

/* ---------------- 1. Online / Visitas ---------------- */
function obterSid() {
  try {
    let sid = sessionStorage.getItem('rifa-sid');
    if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('rifa-sid', sid); }
    return sid;
  } catch { return 'anon-' + Date.now() + Math.random().toString(36).slice(2, 10); }
}
const SID = obterSid();

function mostrar(id, v) {
  const el = $(id);
  if (el && v != null && el.textContent !== String(v)) el.textContent = v;
}

async function postStats(body) {
  try {
    const r = await fetch(API_STATS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) return;
    const d = await r.json();
    mostrar('online', d.online); mostrar('visits', d.visits);
  } catch {}
}

(function registrarVisita() {
  let jaContou = false;
  try { jaContou = sessionStorage.getItem('rifa-visita') === '1'; sessionStorage.setItem('rifa-visita', '1'); } catch {}
  const hb = () => postStats({ action: 'heartbeat', sid: SID });
  if (jaContou) hb(); else postStats({ action: 'visit' }).then(hb);
})();
setInterval(() => { if (!document.hidden) postStats({ action: 'heartbeat', sid: SID }); }, 15000);
const sair = () => navigator.sendBeacon && navigator.sendBeacon(API_STATS, JSON.stringify({ action: 'leave', sid: SID }));
document.addEventListener('visibilitychange', () => { if (document.hidden) sair(); else postStats({ action: 'heartbeat', sid: SID }); });
addEventListener('pagehide', sair);

/* ---------------- 2 e 3. Sorteio e encerramento ---------------- */
let encerrado = false;
function definirEncerrado(v) {
  if (v === encerrado) return;
  encerrado = v;
  const aviso = $('vendasEncerradas');
  if (aviso) aviso.style.display = v ? 'block' : 'none';
}
// Bloqueia cliques na cartela depois do início (fase de captura: antes do live-client).
$('grid')?.addEventListener('click', (e) => {
  if (encerrado && e.target.closest('.num')) {
    e.stopPropagation(); e.preventDefault();
    alert('Compras encerradas: o sorteio já começou.');
  }
}, true);

async function atualizarSorteio() {
  let prox = 60000;
  try {
    const r = await fetch(API_SORTEIO, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const fmt = new Date(d.agenda.fim).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    mostrar('drawDate', fmt.replace(',', ' às') + ' (horário de Brasília)');
    definirEncerrado(d.agora >= d.agenda.inicio);
    if (d.numero != null) {
      mostrar('drawnNumber', pad(d.numero));
      mostrar('winnerName', d.ganhador
        ? d.ganhador.nome + (d.ganhador.telefoneFinal ? ' • tel. final ' + d.ganhador.telefoneFinal : '')
        : 'Número não comprado — sem ganhador');
      return;
    }
    if (d.fase !== 'aguardando' || d.agenda.inicio - d.agora < 120000) prox = 5000;
  } catch {}
  setTimeout(atualizarSorteio, prox);
}
atualizarSorteio();

/* ---------------- 4. Compartilhar (v3.8.0) ----------------
 *   1º navigator.share (Android/iPhone: abre WhatsApp, Instagram, SMS…)
 *   2º alternativa: mini-menu com WhatsApp (wa.me) e Copiar link.
 *   Botões: qualquer elemento com a classe .js-compartilhar.            */
const LINK_RIFA = 'https://rifa-chico-da-baixa.netlify.app/';
const TEXTO_RIFA = 'Rifa Solidária em prol do Sr. Francisco Felício (Chico da Baixa) 🙏\n' +
  '199 números a R$ 20 — sorteio ao vivo nas gaiolas em 23/12 às 10h.\nEscolha o seu número e ajude:';

function menuAlternativo(texto, link) {
  document.getElementById('menuCompartilhar')?.remove();
  const fundo = document.createElement('div');
  fundo.id = 'menuCompartilhar';
  fundo.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end;justify-content:center;padding:16px';
  const caixa = document.createElement('div');
  caixa.style.cssText = 'background:#fff;border-radius:16px;padding:16px;width:100%;max-width:420px;text-align:center';
  const titulo = document.createElement('strong'); titulo.textContent = 'Compartilhar a rifa';
  const wa = document.createElement('a');
  wa.href = 'https://wa.me/?text=' + encodeURIComponent(texto + ' ' + link);
  wa.target = '_blank'; wa.rel = 'noopener'; wa.textContent = '🟢 Enviar pelo WhatsApp';
  wa.style.cssText = 'display:block;margin:12px 0 8px;background:#25D366;color:#063;padding:12px;border-radius:10px;font-weight:800;text-decoration:none';
  const copiar = document.createElement('button'); copiar.type = 'button'; copiar.textContent = '🔗 Copiar link';
  copiar.onclick = async () => { try { await navigator.clipboard.writeText(link); copiar.textContent = '✅ Link copiado!'; } catch { copiar.textContent = link; } };
  const fechar = document.createElement('button'); fechar.type = 'button'; fechar.textContent = 'Fechar'; fechar.className = 'secondary';
  fechar.onclick = () => fundo.remove();
  fundo.onclick = (e) => { if (e.target === fundo) fundo.remove(); };
  caixa.append(titulo, wa, copiar, fechar); fundo.append(caixa); document.body.append(fundo);
}

async function compartilhar() {
  const dados = { title: 'Rifa Solidária – Chico da Baixa', text: TEXTO_RIFA, url: LINK_RIFA };
  if (navigator.share) {
    try { await navigator.share(dados); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }   // a pessoa fechou a folha
  }
  menuAlternativo(TEXTO_RIFA, LINK_RIFA);
}
document.addEventListener('click', (e) => {
  if (e.target.closest('.js-compartilhar')) { e.preventDefault(); compartilhar(); }
});

/* ---------------- 5. Aviso "Role para baixo" (v3.10.0) ----------------
 *   O aviso ficava fixo para sempre e cobria o rodapé e os últimos números.
 *   Agora some quando a cartela aparece na tela ou após 10 s.            */
(function esconderAvisoRolagem() {
  const aviso = document.getElementById('scrollHint'), grade = document.getElementById('grid');
  if (!aviso) return;
  const sumir = () => { aviso.style.transition = 'opacity .4s'; aviso.style.opacity = '0'; setTimeout(() => (aviso.style.display = 'none'), 450); };
  setTimeout(sumir, 10000);
  if (grade && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((ent) => { if (ent.some((e) => e.isIntersecting)) { sumir(); obs.disconnect(); } }, { threshold: 0.05 });
    obs.observe(grade);
  }
  aviso.addEventListener('click', () => setTimeout(sumir, 600));
})();
