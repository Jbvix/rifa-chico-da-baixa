/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : vendas.mjs (lógica do painel de vendas em tempo real)
 * Autor    : Jossian Brito
 * Versão   : 3.7.0
 * Data/Hora: 2026-11-16 16:40 (BRT, UTC-3)
 *
 * FUNCIONAMENTO
 *   - Chave lida do fragmento da URL (#k=…): o fragmento não vai para o
 *     servidor em logs nem em "Referer"; é enviado só no header da API.
 *   - Atualiza a cada 10 s (aba visível) / 30 s (oculta).
 *   - Detecta mudanças comparando o "estado" de cada número com a leitura
 *     anterior: novo pagamento informado → alerta forte; nova reserva →
 *     alerta leve. A 1ª leitura só define a referência (sem alarme falso).
 *   - "NOVO" marca o que surgiu desde a última visita (guardado no aparelho).
 *   - Alertas: som (WebAudio), vibração e notificação do sistema (via
 *     Service Worker, exigido pelo Android). Tela acesa (Wake Lock) enquanto
 *     os alertas estiverem ativos.
 *   Analogia: é o vigia de passadiço — a cada ronda compara o radar com a
 *   ronda anterior e só toca o alarme quando aparece um eco novo.
 * MODIFICAÇÕES v3.7.0: arquivo criado.
 * ========================================================================== */
const API = '/.netlify/functions/painel-vendas';
const $ = (id) => document.getElementById(id);
const chave = new URLSearchParams(location.hash.slice(1)).get('k') || '';
const ROT = { confirmado: 'confirmado', pagamento_informado: 'pagamento informado', reserva_ativa: 'reserva ativa', reserva_expirada: 'reserva expirada' };
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const hora = (x) => (x ? new Date(x).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');

let anterior = null;                    // Map numero → situacao (última leitura)
let alertas = false, ctx = null, swReg = null, wake = null;
let vistos = new Set();
try { vistos = new Set(JSON.parse(localStorage.getItem('vendas-vistos') || '[]')); } catch {}
const novosDesdeVisita = new Set();

function erro(msg) { const e = $('erro'); e.textContent = msg; e.hidden = !msg; }

function tocar(forte) {
  if (!ctx) return;
  const notas = forte ? [784, 988, 1319] : [659];
  notas.forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.16;
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.36);
  });
}

async function notificar(titulo, corpo, forte) {
  tocar(forte);
  if (navigator.vibrate) navigator.vibrate(forte ? [200, 80, 200, 80, 300] : [120]);
  if (!alertas || Notification.permission !== 'granted') return;
  try {
    if (swReg) await swReg.showNotification(titulo, { body: corpo, tag: 'rifa-' + Date.now(), renotify: true });
    else new Notification(titulo, { body: corpo });
  } catch {}
}

function cartao(i) {
  const d = document.createElement('div');
  d.className = 'item s-' + i.situacao;
  const n = document.createElement('div'); n.className = 'num'; n.textContent = i.numero;
  const meio = document.createElement('div');
  const nome = document.createElement('div'); nome.className = 'nome'; nome.textContent = i.nome || '(sem nome)';
  if (novosDesdeVisita.has(i.numero + ':' + i.situacao)) { const t = document.createElement('span'); t.className = 'tag t-novo'; t.textContent = 'NOVO'; nome.append(t); }
  const det = document.createElement('div'); det.className = 'det';
  det.textContent = `${ROT[i.situacao]} · ${hora(i.quando)}${i.expiraEm ? ' · expira ' + hora(i.expiraEm) : ''} · ${i.telefone}`;
  meio.append(nome, det);
  const dig = String(i.telefone).replace(/\D/g, '');
  const wa = document.createElement('a'); wa.className = 'wa'; wa.textContent = 'WhatsApp';
  wa.href = 'https://wa.me/' + (dig.startsWith('55') ? dig : '55' + dig); wa.target = '_blank'; wa.rel = 'noopener';
  d.append(n, meio, dig.length >= 10 ? wa : document.createElement('span'));
  return d;
}

async function atualizar() {
  if (!chave) { erro('Abra o painel pelo link completo que você recebeu (ele termina com #k=…).'); return; }
  try {
    const r = await fetch(API, { cache: 'no-store', headers: { 'x-painel-chave': chave } });
    if (r.status === 401) { erro('Link inválido ou expirado. Peça um novo link ao Jossian.'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json(); erro('');
    const atual = new Map(d.itens.map((i) => [i.numero, i.situacao]));

    // Alertas por mudança (a 1ª leitura só define a referência)
    if (anterior) {
      for (const i of d.itens) {
        const antes = anterior.get(i.numero);
        if (antes === i.situacao) continue;
        if (i.situacao === 'pagamento_informado' || i.situacao === 'confirmado') notificar(`💰 Número ${i.numero} comprado`, `${i.nome} informou o pagamento.`, true);
        else if (i.situacao === 'reserva_ativa') notificar(`🕒 Nova reserva: ${i.numero}`, `${i.nome} está reservando (ainda sem pagamento).`, false);
      }
    }
    anterior = atual;

    // "NOVO" desde a última visita neste aparelho
    for (const i of d.itens) { const k = i.numero + ':' + i.situacao; if (!vistos.has(k) && vistos.size) novosDesdeVisita.add(k); }
    vistos = new Set(d.itens.map((i) => i.numero + ':' + i.situacao));
    try { localStorage.setItem('vendas-vistos', JSON.stringify([...vistos])); } catch {}

    $('tComprados').textContent = d.totais.comprados;
    $('tArrecadado').textContent = brl(d.totais.arrecadado);
    $('tReservas').textContent = d.totais.reservasAtivas;
    $('tDisponiveis').textContent = d.totais.disponiveis;
    const grupos = { lComprados: (i) => i.ordem <= 1, lAtivas: (i) => i.ordem === 2, lExpiradas: (i) => i.ordem === 3 };
    for (const [id, f] of Object.entries(grupos)) {
      const lista = d.itens.filter(f);
      $(id).replaceChildren(...(lista.length ? lista.map(cartao) : [Object.assign(document.createElement('div'), { className: 'det', textContent: 'Nenhum.' })]));
    }
    document.title = `(${d.totais.comprados}) Vendas ao vivo · Rifa`;
    $('atualizado').textContent = `Atualizado às ${new Date(d.agora).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · vendas ${d.vendas === 'open' ? 'abertas' : d.vendas}`;
  } catch (e) {
    erro('Sem conexão. Tentando de novo…');
  }
}

async function ativarAlertas() {
  try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); await ctx.resume(); } catch {}
  try { if ('serviceWorker' in navigator) swReg = await navigator.serviceWorker.register('/vendas-sw.js'); } catch {}
  let perm = 'unsupported';
  try { if ('Notification' in window) perm = await Notification.requestPermission(); } catch {}
  alertas = true;
  try { if ('wakeLock' in navigator) wake = await navigator.wakeLock.request('screen'); } catch {}
  $('btnAlertas').textContent = '🔔 Alertas ativos';
  $('btnAlertas').className = 'btn sec';
  $('estadoAlertas').textContent = perm === 'granted' ? 'Som, vibração e notificação ligados. Deixe esta página aberta.' : 'Som e vibração ligados (notificações não permitidas neste aparelho). Deixe esta página aberta.';
  tocar(false);
}
$('btnAlertas').addEventListener('click', ativarAlertas);
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) { atualizar(); if (alertas && 'wakeLock' in navigator) { try { wake = await navigator.wakeLock.request('screen'); } catch {} } }
});

atualizar();
(function ciclo() { setTimeout(() => { atualizar(); ciclo(); }, document.hidden ? 30000 : 10000); })();
