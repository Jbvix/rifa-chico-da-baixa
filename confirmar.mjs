/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : confirmar.mjs (lógica da conferência do Pix — ADMIN)
 * Autor    : Jossian Brito
 * Versão   : 3.9.0
 * Data/Hora: 2026-11-16 18:00 (BRT, UTC-3)
 *   - Chave do fragmento da URL (#k=…), enviada só no header x-admin-chave.
 *   - Cada ação envia a versão que a tela mostrou (versaoEsperada): se os
 *     dados mudaram, o servidor recusa e a tela pede para atualizar.
 *   - Pergunta de confirmação antes de gravar (evita toque acidental).
 * MODIFICAÇÕES v3.9.0: arquivo criado.
 * ========================================================================== */
const API = '/.netlify/functions/confirmar-pagamento';
const $ = (id) => document.getElementById(id);
const chave = new URLSearchParams(location.hash.slice(1)).get('k') || '';
const hora = (x) => (x ? new Date(x).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
let versao = 0, ocupado = false;

function msg(texto, tipo = '') { const m = $('msg'); m.textContent = texto; m.className = 'aviso ' + tipo; m.hidden = !texto; }

async function api(corpo) {
  const r = await fetch(API, corpo
    ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-chave': chave }, body: JSON.stringify(corpo) }
    : { cache: 'no-store', headers: { 'x-admin-chave': chave } });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401) throw new Error('Link inválido ou expirado. Peça um novo link ao Jossian.');
  if (!r.ok) throw new Error(d.error || 'Erro ' + r.status);
  return d;
}

function cartao(i) {
  const c = document.createElement('div'); c.className = 'item s-' + i.pagamento;
  const topo = document.createElement('div'); topo.className = 'topo';
  const n = document.createElement('span'); n.className = 'num'; n.textContent = i.numero;
  const nome = document.createElement('span'); nome.className = 'nome'; nome.textContent = i.nome || '(sem nome)';
  topo.append(n, nome);
  const det = document.createElement('div'); det.className = 'det';
  det.textContent = `${i.telefone} · ${i.pagamento === 'not_declared' ? 'reservado' : 'informado'} ${hora(i.quando)}` + (i.verificadoEm ? ` · conferido ${hora(i.verificadoEm)}` : '');
  c.append(topo, det);
  if (i.pagamento === 'declared' || i.pagamento === 'verified') {
    const verificar = i.pagamento === 'declared';
    const b = document.createElement('button');
    b.className = verificar ? 'confirmar' : 'desfazer';
    b.textContent = verificar ? '✅ Confirmar Pix recebido' : '↩️ Desfazer conferência';
    b.onclick = () => agir(b, i, verificar ? 'verificar' : 'desfazer');
    c.append(b);
  }
  return c;
}

async function agir(botao, i, acao) {
  if (ocupado) return;
  const pergunta = acao === 'verificar'
    ? `Confirmar que o Pix de R$ 20,00 de ${i.nome} (número ${i.numero}) ESTÁ no extrato?`
    : `Desfazer a conferência do número ${i.numero} (${i.nome})? Ele volta para "pagamento informado".`;
  if (!confirm(pergunta)) return;
  ocupado = true; botao.disabled = true;
  try {
    await api({ acao, numero: i.numero, reservationId: i.reservationId, versaoEsperada: versao });
    msg(acao === 'verificar' ? `Número ${i.numero} conferido ✅` : `Conferência do ${i.numero} desfeita.`, 'ok');
  } catch (e) { msg(e.message, 'erro'); }
  ocupado = false;
  await carregar(false);
}

async function carregar(limparMsg = true) {
  if (!chave) { msg('Abra pelo link completo que você recebeu (ele termina com #k=…).', 'erro'); return; }
  try {
    const d = await api();
    versao = d.versao;
    if (limparMsg) msg('');
    const vazio = () => Object.assign(document.createElement('div'), { className: 'det', textContent: 'Nenhum.' });
    const grupo = (f) => { const l = d.itens.filter(f); return l.length ? l.map(cartao) : [vazio()]; };
    $('lDeclarados').replaceChildren(...grupo((i) => i.pagamento === 'declared'));
    $('lVerificados').replaceChildren(...grupo((i) => i.pagamento === 'verified'));
    $('lReservas').replaceChildren(...grupo((i) => i.reservaAtiva));
    $('atualizado').textContent = `Atualizado às ${new Date(d.agora).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · conferências v${d.versao}`;
  } catch (e) { msg(e.message, 'erro'); }
}
$('btnAtualizar').addEventListener('click', () => carregar());
carregar();
setInterval(() => { if (!document.hidden && !ocupado) carregar(false); }, 20000);
