/* =============================================================================
 * Rifa Solidária – Sr. Francisco Felício (Chico da Baixa)
 * Arquivo  : sorteio.js (lógica da gaiola, extraída de sorteio.html)
 * Autor    : Jossian Brito
 * Versão   : 3.5.0
 * Data/Hora: 2026-11-16 11:10 (BRT, UTC-3)
 * MODIFICAÇÕES v3.5.0 (2026-11-16 15:40 BRT): ESCALA FÍSICA REAL + COLISÕES
 *   - Escala: raio da gaiola 1,45 un ≈ 0,15 m → 1 un ≈ 0,1 m. Gravidade real
 *     g = 9,8 m/s² = 98 un/s² (antes 9 → "câmera lenta", ~10× mais lento).
 *   - Passo físico 1/480 s (bolas rápidas não atravessam umas às outras).
 *   - Restituição: bola-bola 0,85 ; bola-parede 0,70 ; bola-pino 0,70.
 *   - Colisão bola-bola com 3 iterações por passo + atrito tangencial
 *     (bolas amontoadas se separam; troca de "efeito" entre elas).
 *   - Atrito com parede/pinos como relaxação exponencial (τ = 33 ms) em vez
 *     de 25% por passo (a bola "colava" na parede e não se espalhava).
 *   - Arrasto do ar 0,05 s⁻¹ (desprezível, como na realidade).
 *   - Condução, som e tubo reescalados para a nova gravidade.
 *   - 4 aletas junto à parede (0,80·R) levantam as bolas (dispersão 19% →
 *     42% na metade de cima); atrito de contato τ = 8 ms; ω = 9 rad/s.
 *   - Condução: K = 1500 com amortecimento crítico, rampa 0,8 s →
 *     captura natural na comporta em 29 de 30 sorteios (física pura).
 *   - Medido (física pura): 54 choques bola-bola/s (antes 5), 0 bolas fora,
 *     0 sobreposição, mistura por inércia ~0,9 s após a parada.
 *   - Sorteio oficial: gaiolas começam a girar às 09:50 (antes 09:55).
 * MODIFICAÇÕES v3.4.0 (2026-11-16 15:10 BRT): TEMPOS 30 s / 40 s / 50 s
 *   - Demonstração e teste: centena cai aos 30 s, dezena aos 40 s e unidade
 *     aos 50 s após o início do giro — mesmo motor cronometrado do oficial
 *     (animarGaiola), com auditorias (máx. 2) encaixadas antes de cada queda.
 *   - Contagem regressiva no painel durante a demonstração.
 *   - Sorteio oficial inalterado (09:59:40 / 09:59:50 / 10:00:00).
 * MODIFICAÇÕES v3.3.0 (2026-11-16 14:50 BRT): SOM DAS BOLAS BATENDO
 *   - Novo estalo de bola plástica (ruído curto + filtro passa-faixa) em TODOS
 *     os choques: bola-bola, bola-parede e bola-pino; também com a gaiola
 *     parada (a mistura por inércia agora é audível) e na chegada ao copo.
 *   - Volume ∝ energia do choque (v²), estéreo por gaiola, até ~80 estalos/s.
 *   - Antes: só parede/pino, ω > 1 e volume 0,025 (inaudível sob a trilha).
 * MODIFICAÇÕES v3.2.0 (2026-11-16 14:30 BRT): MÚSICA ATÉ O SORTEIO + DEMONSTRAÇÃO
 *   - A trilha gospel toca (em loop) desde o toque em "ativar som" até o
 *     resultado oficial — não só a partir das 09:55.
 *   - Botão "Ver demonstração das gaiolas": o visitante assiste ao
 *     funcionamento completo (giro, mistura, auditoria, tubo, copo).
 *     Resultado local e NÃO oficial, sem ganhador e sem as falas de
 *     abertura/agradecimento. Disponível até 2 min antes do início oficial.
 *     Depois de ~8 s as bolas voltam às gaiolas.
 * MODIFICAÇÕES v3.1.0 (2026-11-16 14:10 BRT): MISTURA CONTINUA APÓS A PARADA
 *   - Condução suave: k cresce de 0 a 80 em 0,8 s (k = 80·(t/0,8)²) e o
 *     amortecimento é 70% do crítico → logo após a parada a bola sorteada se
 *     move pela inércia como as demais.
 *   - Captura natural: a comporta abre e a bola entra no tubo quando PASSA
 *     por ela (|p − comporta| < 0,30), com a própria velocidade (0,5–1,6).
 *     Janela de 0,45 s (comporta abre 1,2 s antes da revelação); se a bola
 *     não passar, entra pelo limite de segurança. Física pura, 60 sorteios:
 *     ~70% de captura natural.
 * MODIFICAÇÕES v3.0.0 (2026-11-16 13:30 BRT): MISTURA E TUBO DE SAÍDA (física)
 *   - 6 esferas fixas (pinos) presas ao tambor de cada gaiola, girando com
 *     ele; colidem com as bolas pela mesma lei da parede (reflexão + arraste
 *     da superfície móvel ω × r) → embaralhamento muito maior.
 *   - O ângulo do tambor passou a ser integrado dentro do passo físico
 *     (1/240 s), para os pinos não "saltarem" entre quadros.
 *   - Saída da bola: comporta no fundo + tubo de vidro até um copo com lupa
 *     na frente da base. No tubo, a bola ROLA: a = (5/7)·g·sen θ (esfera
 *     maciça rolando sem deslizar) menos resistência ao rolamento.
 *   - Fim da bola "voando" e crescendo no ar; a auditoria é devolvida por
 *     cima da gaiola e cai de volta pela gravidade.
 *   - Modelo original (gravidade, parede, arraste, bola-bola) inalterado.
 * MODIFICAÇÕES v2.9.0 (2026-11-16 12:50 BRT): VOZES E TRILHA GRAVADAS
 *   - Vozes ElevenLabs: Jossian Brito (voz clonada) na abertura e no
 *     agradecimento; Carla (institucional) em auditoria/centena/dezena/unidade.
 *   - Trilha gospel instrumental nova (ElevenLabs Music, 120 s, em loop)
 *     durante o giro; abaixa sozinha sob as falas ("ducking").
 *   - Áudio carregado com fetch + WebAudio (a CSP bloqueia <audio>), só depois
 *     do toque em "Ativar som" (exigência dos navegadores de celular).
 * MODIFICAÇÕES v2.6.0: script movido para arquivo próprio — a política de
 *   segurança do site (CSP script-src 'self') bloqueia scripts embutidos.
 *   Three.js r128 hospedado no próprio site (/vendor), pelo mesmo motivo.
 * ========================================================================== */

'use strict';
/* ===========================================================================
 * CONFIGURAÇÃO
 * ========================================================================= */
let TOTAL = 199;                         // atualizado pela API, se disponível
const REDUZIR = matchMedia('(prefers-reduced-motion: reduce)').matches;
const T = REDUZIR ? 0.35 : 1;            // fator de tempo das animações
const CAGE_R = 1.45;                     // raio interno da gaiola (unid. 3D)
const BALL_R = 0.2;                      // raio da bola
const CAGE_Y = 0.9;                      // altura do centro das gaiolas
const CAGE_X = [-3.3, 0, 3.3];           // posição das 3 gaiolas
const PISO_Y = -1.5;                     // altura do tampo da mesa (entorno)
const PINO_R = 0.13;                     // raio das esferas fixas de mistura (v3.0.0)
const N_ALETAS = 4;                      // aletas junto à parede (v3.5.0)
const OMEGA_GIRO = 9;                    // rad/s ≈ 86 rpm (v3.5.0; antes 7)
// Centro da bola ao longo do tubo, em coordenadas da gaiola (centro = 0,0,0):
// comporta no fundo → queda curta → rampa suave até o copo na frente da base.
const TUBO_PONTOS = [[0, -1.25, 0], [0, -1.6, 0.15], [0.08, -1.68, 0.6], [0.17, -1.73, 1.0], [0.25, -1.76, 1.42]]
  .map(([x, y, z]) => new THREE.Vector3(x, y, z));
const CORES = [0x1565C0, 0x00884f, 0xf2b705]; // centena (azul), dezena, unidade
const COR_AUDITORIA = 0xC8102E;          // vermelho exclusivo da bola de auditoria
const AUDITORIA = 'A';                   // rótulo da bola de auditoria
const ROTULOS = ['Centena', 'Dezena', 'Unidade'];
const API_NUM = '/.netlify/functions/numeros';
// Modo teste: ?teste=1 mostra os elementos marcados com data-teste.
const MODO_TESTE = new URLSearchParams(location.search).get('teste') === '1';
if (MODO_TESTE) document.querySelectorAll('[data-teste]').forEach((el) => (el.hidden = false));

const $ = (id) => document.getElementById(id);
const espera = (ms) => new Promise((r) => setTimeout(r, ms * T));
const pad = (n) => String(n).padStart(3, '0');

/* ===========================================================================
 * SORTEIO JUSTO — crypto.getRandomValues + amostragem por rejeição
 *
 *   Problema: x % N com x uniforme em [0, 2^32) favorece levemente os
 *   primeiros (2^32 mod N) valores (viés de módulo).
 *   Solução: descartar x ≥ limite, onde limite = ⌊2^32 / N⌋ · N.
 *   Assim cada resto 0..N−1 tem exatamente ⌊2^32/N⌋ pré-imagens.
 *   Para N = 199: limite = 21 582 457·199 → descarta só 0,000002% dos casos.
 *   Resultado = 1 + (x mod N)  ∈ [1, N].
 *   Analogia: é como ignorar a leitura do ecobatímetro quando o casco
 *   está fora do prumo — só aceitamos medições na condição válida.
 * ========================================================================= */
function sortearNumero(N) {
  const limite = Math.floor(0x100000000 / N) * N;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limite);
  return 1 + (buf[0] % N);
}

/* ===========================================================================
 * ÁUDIO — sons sintetizados com WebAudio (sem baixar arquivos)
 * ========================================================================= */
let somLigado = true, actx = null;
function tom(freq, dur = 0.12, tipo = 'sine', vol = 0.15, atraso = 0) {
  if (!somLigado) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime + atraso;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = tipo; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(actx.destination);
    o.start(t0); o.stop(t0 + dur);
  } catch (e) {}
}
/* ---------------------------------------------------------------------------
 * ESTALO DE BOLA (v3.3.0)
 *   Fonte: rajada de ruído branco com decaimento exponencial
 *     x[n] = ruído[n] · e^(−n / (fs·τ)),   τ = 4 ms   (choque seco, curto)
 *   Filtro passa-faixa 2,2–4 kHz, Q = 3: timbre de esfera plástica oca.
 *   Volume ∝ energia cinética do choque:  g = min(0,45 ; 0,05·(v/3,3)²)
 *     v = 1 m/s → 0,05 (leve) ; v = 3 m/s → 0,45 (forte, limitado).
 *   Pan estéreo por gaiola: centena −0,7 ; dezena 0 ; unidade +0,7.
 *   Limite: ≥ 12 ms entre estalos (≤ ~80/s) para não sobrecarregar o celular.
 *   Analogia: é o "batido" das ondas no costado — cada impacto tem a força
 *   do quadrado da velocidade relativa.
 * ------------------------------------------------------------------------- */
let ruidoImpacto = null, ultimoEstalo = 0;
function somImpacto(vel, gaiolaIdx = 1) {
  if (!somLigado || !audioLiberado || !actx || actx.state !== 'running') return;
  const c = actx, t = c.currentTime;
  if (t - ultimoEstalo < 0.012) return;
  // v3.5.0: velocidades em escala real (~3,3× maiores) → v normalizado por 3,3
  const vr = vel / 3.3, g0 = Math.min(0.45, 0.05 * vr * vr);
  if (g0 < 0.01) return;
  ultimoEstalo = t;
  if (!ruidoImpacto) {
    const n = Math.floor(c.sampleRate * 0.05), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.004));
    ruidoImpacto = buf;
  }
  const src = c.createBufferSource(); src.buffer = ruidoImpacto; src.playbackRate.value = 0.8 + Math.random() * 0.5;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200 + Math.random() * 1800; bp.Q.value = 3;
  const g = c.createGain(); g.gain.value = g0;
  src.connect(bp).connect(g);
  if (c.createStereoPanner) { const pan = c.createStereoPanner(); pan.pan.value = [-0.7, 0, 0.7][gaiolaIdx] ?? 0; g.connect(pan).connect(c.destination); }
  else g.connect(c.destination);
  src.start(t);
}
const somRevela = (i) => { tom(523 + i * 130, 0.18, 'triangle', 0.2); tom(784 + i * 130, 0.22, 'sine', 0.12, 0.08); };
const somFinal = () => [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.35, 'triangle', 0.18, i * 0.12));

/* ===========================================================================
 * ÁUDIO GRAVADO (v2.9.0) — vozes + trilha
 *   Cadeia de sinal (WebAudio):  fonte → ganho → saída
 *   Ducking da trilha durante uma fala de duração d (s):
 *     ganho(t) → 0,08 com constante de tempo 0,15 s (abaixa rápido)
 *     e volta a VOL_TRILHA a partir de t+d com constante 0,4 s (sobe suave).
 *   Resposta exponencial de 1ª ordem: g(t) = g∞ + (g0 − g∞)·e^(−t/τ),
 *   igual ao ω das gaiolas — sem "degraus" audíveis.
 *   Uma fala nova interrompe a anterior (prioridade ao anúncio mais recente).
 * ========================================================================= */
const AUDIO_DIR = '/audio/sorteio/';
const FAIXAS = ['voz-abertura', 'voz-auditoria', 'voz-centena', 'voz-dezena', 'voz-unidade', 'voz-agradecimento', 'trilha-gospel'];
const VOL_TRILHA = 0.28;
const buffers = {};
let audioLiberado = false, carregando = null, trilhaNode = null, trilhaGain = null, vozAtual = null;
const ctxAudio = () => (actx = actx || new (window.AudioContext || window.webkitAudioContext)());

function carregarAudios() {
  carregando = carregando || Promise.all(FAIXAS.map(async (n) => {
    try {
      const r = await fetch(AUDIO_DIR + n + '.mp3');
      buffers[n] = await ctxAudio().decodeAudioData(await r.arrayBuffer());
    } catch (e) { console.warn('áudio indisponível:', n); }
  }));
  return carregando;
}

function abaixarTrilha(seg) {
  if (!trilhaGain) return;
  const t = actx.currentTime;
  trilhaGain.gain.cancelScheduledValues(t);
  trilhaGain.gain.setTargetAtTime(0.08, t, 0.15);
  trilhaGain.gain.setTargetAtTime(VOL_TRILHA, t + seg, 0.4);
}

function falar(nome) {
  if (!somLigado || !audioLiberado || !buffers[nome]) return;
  try { vozAtual && vozAtual.stop(); } catch {}
  const c = ctxAudio(), s = c.createBufferSource();
  s.buffer = buffers[nome];
  s.connect(c.destination);
  s.start();
  vozAtual = s;
  s.onended = () => { if (vozAtual === s) vozAtual = null; };
  abaixarTrilha(s.buffer.duration);
}

function iniciarTrilha() {
  if (trilhaNode || !somLigado || !audioLiberado || !buffers['trilha-gospel']) return;
  const c = ctxAudio();
  trilhaGain = c.createGain();
  trilhaGain.gain.value = 0;
  trilhaGain.gain.setTargetAtTime(VOL_TRILHA, c.currentTime, 1.0);   // entra em ~3 s
  trilhaNode = c.createBufferSource();
  trilhaNode.buffer = buffers['trilha-gospel'];
  trilhaNode.loop = true;
  trilhaNode.connect(trilhaGain).connect(c.destination);
  trilhaNode.start();
}

function pararTrilha(fadeSeg = 4) {
  if (!trilhaNode) return;
  const n = trilhaNode, g = trilhaGain;
  trilhaNode = null; trilhaGain = null;
  g.gain.cancelScheduledValues(actx.currentTime);
  g.gain.setTargetAtTime(0, actx.currentTime, fadeSeg / 3);
  setTimeout(() => { try { n.stop(); } catch {} }, fadeSeg * 1000 + 200);
}

// Trilha deve tocar enquanto as gaiolas giram (entre o início e o resultado).
let trilhaDesejada = false;
function querTrilha(v) { trilhaDesejada = v; if (v) iniciarTrilha(); else pararTrilha(); }

async function ativarSom() {
  const c = ctxAudio();
  try { await c.resume(); } catch {}
  audioLiberado = true;
  $('ativarSom').hidden = true;
  $('ativarSom').textContent = '⏳ Carregando sons…';
  await carregarAudios();
  if (trilhaDesejada) iniciarTrilha();
}

/* ===========================================================================
 * CENA 3D (Three.js r128)
 * ========================================================================= */
let renderer, scene, camera, gaiolas = [], bolas = [], webglOk = true;

function texturaBola(digito, cor) {
  // Textura equirretangular 256×128. Em SphereGeometry, u=0.25 aponta para +z
  // (câmera) com rotação zero; desenhamos o dígito em u=0.25 e u=0.75 para
  // ele ser visível dos dois lados enquanto a bola gira.
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#' + cor.toString(16).padStart(6, '0'); g.fillRect(0, 0, 256, 128);
  [64, 192].forEach((x) => {
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, 64, 30, 40, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111'; g.font = 'bold 54px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(digito), x, 67);
  });
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}

// Placa de identificação da gaiola (canvas → textura).
function texturaPlaca(titulo, faixa, cor) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(10,20,15,.92)'; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 504, 120, 22) : g.rect(4, 4, 504, 120); g.fill();
  g.fillStyle = '#' + cor.toString(16).padStart(6, '0'); g.fillRect(4, 104, 504, 20);
  g.fillStyle = '#fff'; g.font = 'bold 50px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(titulo.toUpperCase(), 256, 46);
  g.font = '26px system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText('bolas ' + faixa, 256, 86);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}

// Gradiente radial preto → transparente (sombra de contato barata, sem shadow map).
let _texSombra = null;
function texturaSombra() {
  if (_texSombra) return _texSombra;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return (_texSombra = new THREE.CanvasTexture(c));
}

// Faixa do painel de fundo.
function texturaFaixa() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 256;
  const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 0, 256);
  lg.addColorStop(0, '#0d4a2f'); lg.addColorStop(1, '#062a1a');
  g.fillStyle = lg; g.fillRect(0, 0, 2048, 256);
  g.fillStyle = '#f2b705'; g.fillRect(0, 0, 2048, 8); g.fillRect(0, 248, 2048, 8);
  g.font = 'bold 96px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText('RIFA SOLIDÁRIA • CHICO DA BAIXA', 1024, 132);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  // Vista por dentro (BackSide) a coordenada u fica invertida → espelha de volta.
  t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1;
  return t;
}

// Gaiola em foco: holofote + brilho do aro na gaiola i; null = todas neutras.
function focarGaiola(i) {
  gaiolas.forEach((g, k) => (g.focoAlvo = i === null ? 0 : (k === i ? 1 : -1)));
}

function criarGaiola(idx) {
  const grupo = new THREE.Group();
  grupo.position.set(CAGE_X[idx], CAGE_Y, 0);
  scene.add(grupo);

  // Gaiola giratória: arame (wireframe) dourado + "vidro" levemente visível.
  const giro = new THREE.Group(); grupo.add(giro);
  giro.add(new THREE.Mesh(
    new THREE.SphereGeometry(CAGE_R + 0.05, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xe8c45a, wireframe: true, transparent: true, opacity: 0.55 })));
  giro.add(new THREE.Mesh(
    new THREE.SphereGeometry(CAGE_R + 0.04, 32, 24),
    new THREE.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.07, roughness: 0.1, metalness: 0.2, depthWrite: false })));
  // Aros de reforço cruzados (v2.3.0). O toro nasce no plano xy, que CONTÉM o
  // eixo de giro x; girando ±45° em torno de x, os dois aros continuam sendo
  // meridianos da gaiola (giram junto sem "bambolear") e, vistos de frente,
  // aparecem como elipses com semi-eixo vertical R·cos(45°) ≈ 0,71·R — nunca
  // de perfil como o aro único anterior, que parecia uma haste vertical.
  // Material compartilhado: um só ajuste de brilho acende os dois aros.
  const matAro = new THREE.MeshStandardMaterial({ color: CORES[idx], metalness: 0.6, roughness: 0.35 });
  const geoAro = new THREE.TorusGeometry(CAGE_R + 0.06, 0.035, 8, 64);
  const aro = new THREE.Mesh(geoAro, matAro);
  [Math.PI / 4, -Math.PI / 4].forEach((ang) => {
    const m = new THREE.Mesh(geoAro, matAro);
    m.rotation.x = ang; giro.add(m);
  });

  // ---------------- ENTORNO (v2.1.0) ----------------
  // Coordenadas locais do grupo: centro da gaiola em y=0; mesa em y = PISO_Y − CAGE_Y.
  const yMesa = PISO_Y - CAGE_Y;                       // = −2,4 com os valores atuais
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8c0c4, metalness: 0.85, roughness: 0.28 });
  const metalEsc = new THREE.MeshStandardMaterial({ color: 0x4a5257, metalness: 0.7, roughness: 0.4 });

  // Eixo horizontal (x)
  const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, CAGE_R * 2 + 0.9, 16), metal);
  eixo.rotation.z = Math.PI / 2; grupo.add(eixo);

  // Base: chapa elíptica sobre a mesa
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 40), metalEsc);
  base.scale.set(CAGE_R + 0.55, 1, 0.75);
  base.position.y = yMesa + 0.06; grupo.add(base);

  // Colunas em "A" de cada lado: duas hastes inclinadas que se encontram no mancal.
  // Inclinação θ = atan(abertura / altura) — mais abertura, mais estabilidade.
  const lado = CAGE_R + 0.32, altura = -yMesa - 0.12, abertura = 0.38;
  const compr = Math.hypot(altura, abertura), theta = Math.atan2(abertura, altura);
  [-1, 1].forEach((s) => {
    [-1, 1].forEach((f) => {
      const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, compr, 10), metal);
      haste.position.set(s * lado, yMesa + 0.12 + altura / 2, f * abertura / 2);
      haste.rotation.x = -f * theta;                 // topo converge no mancal (z=0)
      grupo.add(haste);
    });
    // Mancal (rolamento) no topo da coluna
    const mancal = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.04, 10, 24), metalEsc);
    mancal.rotation.y = Math.PI / 2; mancal.position.x = s * lado; grupo.add(mancal);
  });

  // Manivela na ponta direita do eixo — presa ao "giro", gira junto com o tambor.
  const braco = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.07), metal);
  braco.position.set(CAGE_R + 0.48, 0.19, 0); giro.add(braco);
  const pega = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 12),
    new THREE.MeshStandardMaterial({ color: CORES[idx], roughness: 0.5 }));
  pega.rotation.z = Math.PI / 2; pega.position.set(CAGE_R + 0.6, 0.38, 0); giro.add(pega);

  // Placa frontal na base
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.31),   // v3.0.0: menor e à esquerda do copo
    new THREE.MeshBasicMaterial({ map: texturaPlaca(ROTULOS[idx], (idx === 0 ? '0 – 1' : '0 – 9') + ' + auditoria', CORES[idx]), transparent: true }));
  placa.position.set(-0.74, yMesa + 0.3, 0.95); placa.rotation.x = -0.12; grupo.add(placa);

  // Sombra de contato: disco com gradiente radial, logo acima da mesa
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(CAGE_R * 3.2, CAGE_R * 1.9),
    new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = yMesa + 0.005; grupo.add(sombra);

  // Holofote dedicado (aceso só quando esta gaiola está em foco)
  const holofote = new THREE.SpotLight(0xfff1c9, 0, 14, 0.42, 0.55, 1.2);
  holofote.position.set(CAGE_X[idx] * 0.6, CAGE_Y + 5.5, 3.2);
  holofote.target = grupo; scene.add(holofote);

  // ---------- MISTURA: esferas fixas presas ao tambor (v3.0.0) ----------
  // 6 pinos em anel (raio 0,62·R), alternando ±0,38·R no eixo x, a cada 60°.
  const matPino = new THREE.MeshStandardMaterial({ color: 0xd9b44a, metalness: 0.85, roughness: 0.25 });
  const pinosLocal = [];
  // v3.5.0: + N_ALETAS "aletas" junto à parede (raio 0,80·R): como as pás de um
  // tambor misturador, levantam as bolas e as soltam lá em cima → dispersão.
  for (let k = 0; k < 6 + N_ALETAS; k++) {
    const aleta = k >= 6;
    const phi = aleta ? (k - 6) * 2 * Math.PI / N_ALETAS + Math.PI / 4 : k * Math.PI / 3;
    const rr = (aleta ? 0.80 : 0.62) * CAGE_R, x = aleta ? ((k % 2 ? 1 : -1) * 0.2 * CAGE_R) : (k % 2 ? 1 : -1) * 0.38 * CAGE_R;
    const pl = new THREE.Vector3(x, rr * Math.cos(phi), rr * Math.sin(phi));
    pinosLocal.push(pl);
    const pino = new THREE.Mesh(new THREE.SphereGeometry(PINO_R, 16, 12), matPino);
    pino.position.copy(pl); giro.add(pino);
    // haste que prende o pino ao arame (visual)
    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, CAGE_R - rr, 6), matPino);
    haste.position.copy(pl).multiplyScalar((rr + (CAGE_R - rr) / 2) / rr); haste.position.x = x;
    haste.lookAt(new THREE.Vector3(x, 0, 0)); haste.rotateX(Math.PI / 2); giro.add(haste);
  }

  // ---------- SAÍDA: comporta + tubo de vidro + copo com lupa (v3.0.0) ----------
  const vidro = new THREE.MeshStandardMaterial({ color: 0xcfefff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const comporta = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 8, 32), metalEsc);
  comporta.rotation.x = Math.PI / 2; comporta.position.set(0, -CAGE_R - 0.02, 0); grupo.add(comporta);
  const caminho = new THREE.CatmullRomCurve3(TUBO_PONTOS.map((q) => q.clone()));
  grupo.add(new THREE.Mesh(new THREE.TubeGeometry(caminho, 48, BALL_R + 0.05, 16, false), vidro));
  const fimTubo = TUBO_PONTOS[TUBO_PONTOS.length - 1];
  const copo = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.2, 24, 1, true), metalEsc);
  copo.position.set(fimTubo.x, fimTubo.y - 0.12, fimTubo.z); grupo.add(copo);
  const fundo = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), metalEsc);
  fundo.rotation.x = -Math.PI / 2; fundo.position.set(fimTubo.x, fimTubo.y - 0.21, fimTubo.z); grupo.add(fundo);
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, fimTubo.y - 0.21 - yMesa, 8), metal);
  poste.position.set(fimTubo.x, (fimTubo.y - 0.21 + yMesa) / 2, fimTubo.z); grupo.add(poste);
  const lupa = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), vidro);
  lupa.position.set(fimTubo.x, fimTubo.y - 0.1, fimTubo.z); grupo.add(lupa);

  // Pódio: anel luminoso em volta do copo (aceso na extração)
  const podio = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 10, 48),
    new THREE.MeshBasicMaterial({ color: CORES[idx], transparent: true, opacity: 0 }));
  podio.rotation.x = Math.PI / 2; podio.position.set(fimTubo.x, fimTubo.y - 0.12, fimTubo.z); grupo.add(podio);

  // Bolas: centena só tem 0 e 1 (faixa 001..199); dezena e unidade 0..9.
  // Bolas: centena 0–1, dezena e unidade 0–9, e em TODAS uma auditoria vermelha.
  const digitos = (idx === 0 ? [0, 1] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).concat(AUDITORIA);
  const geo = new THREE.SphereGeometry(BALL_R, 24, 16);
  digitos.forEach((d) => {
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texturaBola(d, d === AUDITORIA ? COR_AUDITORIA : CORES[idx]), roughness: 0.35, metalness: 0.05 }));
    scene.add(mesh);
    const b = { mesh, digito: d, gaiola: idx, p: new THREE.Vector3(), v: new THREE.Vector3(), livre: true };
    reposicionar(b);
    bolas.push(b);
  });

  gaiolas.push({ grupo, giro, omega: 0, alvo: 0, ang: 0, aro, holofote, podio, foco: 0, focoAlvo: 0, podioAlvo: 0,
                 pinosLocal, pinosMundo: pinosLocal.map(() => new THREE.Vector3()), caminho, comprimento: caminho.getLength() });
}

// Coloca a bola em um ponto aleatório da metade inferior da gaiola.
function reposicionar(b) {
  const c = new THREE.Vector3(CAGE_X[b.gaiola], CAGE_Y, 0);
  const r = (CAGE_R - BALL_R) * 0.7;
  b.p.set(c.x + (Math.random() - 0.5) * r, c.y - Math.random() * r * 0.8, (Math.random() - 0.5) * r);
  b.v.set(0, 0, 0);
  b.livre = true; b.guia = false; b.capturar = null;
  tubo.delete(b);
  b.mesh.scale.setScalar(1);
  b.mesh.position.copy(b.p);
}

/* ===========================================================================
 * FÍSICA DAS BOLAS (passo fixo de 1/240 s)
 *
 *   1) Gravidade + arrasto viscoso:    v ← v + g·dt ;  v ← v·(1 − k·dt)
 *   2) Integração (Euler semi-implícito): p ← p + v·dt
 *   3) Parede da gaiola (esfera de raio R−r): se |p−c| > R−r
 *        n = (p−c)/|p−c|  (normal para fora)
 *        reflexão:  v ← v − (1+e)(v·n)n          e = restituição (0,55)
 *        atrito com a parede que gira com ω em torno de x:
 *          v_parede = ω × (p−c) = (0, −ω·dz, ω·dy)
 *          v ← v − μ·[(v − v_parede) tangencial]   μ = 0,25
 *      → É a mesma ideia da camada-limite: o fluido (bola) junto à parede
 *        móvel é arrastado pela parede, como a água junto ao casco.
 *   4) Colisão bola-bola (esferas iguais): separa a sobreposição meio a
 *      meio e troca a componente normal da velocidade relativa.
 *   5) (v3.0.0) Esferas fixas no tambor: posição girada por θ em torno de x
 *        y' = y·cosθ − z·sinθ ;  z' = y·sinθ + z·cosθ
 *      velocidade do pino = ω × r ; colisão bola-pino com a MESMA lei da
 *      parede (o pino tem massa "infinita": só a bola muda de velocidade).
 *   6) (v3.1.0) Condução suave até a comporta enquanto a gaiola freia:
 *        a = k(t)·(alvo − p) − c(t)·v ,  k(t) = 80·min(1, t/0,8)² ,
 *        c(t) = 0,7·2√k(t)  (sub-amortecido: a bola ainda oscila/rola)
 *      No início k ≈ 0 → só inércia, gravidade e colisões (mistura segue).
 *   7) (v3.1.0) Captura: com a comporta aberta, se |p − comporta| < 0,30
 *      a bola cai no tubo com a velocidade que tinha.
 * ========================================================================= */
/* v3.5.0 — escala real: 1 unidade ≈ 0,1 m
 *   G      = −98 un/s²  (= 9,8 m/s²)
 *   REST   = 0,85 bola-bola ; REST_PAREDE = 0,70 ; REST_PINO = 0,70
 *   Atrito de contato: v_t,rel ← v_t,rel · e^(−dt/τ),  τ = 33 ms
 *     (fração removida por passo = 1 − e^(−dt/τ) ≈ 6% em 1/480 s)
 *   Velocidade típica: queda livre do topo ao fundo da gaiola (2,5 un)
 *     v = √(2·98·2,5) ≈ 22 un/s ≈ 2,2 m/s ; t = √(2·2,5/98) ≈ 0,23 s */
const G = -98, ARRASTO = 0.05, REST = 0.85, REST_PAREDE = 0.7, TAU_ATRITO = 0.008, DT = 1 / 480, ITER_BOLAS = 3;
const ATRITO = 1 - Math.exp(-DT / TAU_ATRITO);
const tmp = new THREE.Vector3(), n = new THREE.Vector3(), vp = new THREE.Vector3();

const K_GUIA = 1500, RAMPA_GUIA = 0.8, R_CAPTURA = 0.30, REST_PINO = 0.7;
const alvoGuia = new THREE.Vector3();

function passoFisica(dt) {
  // Ângulo do tambor integrado no mesmo passo da física (pinos sem "saltos").
  for (const g of gaiolas) {
    g.ang += g.omega * dt;
    const c = Math.cos(g.ang), s = Math.sin(g.ang);
    g.pinosLocal.forEach((pl, k) => g.pinosMundo[k].set(pl.x, pl.y * c - pl.z * s, pl.y * s + pl.z * c));
  }
  for (const b of bolas) {
    if (!b.livre) continue;
    const gai = gaiolas[b.gaiola];
    if (b.guia) {                                       // condução suave à comporta
      alvoGuia.set(CAGE_X[b.gaiola], CAGE_Y - (CAGE_R - BALL_R), 0);
      const tg = Math.min(1, (performance.now() - b.guia) / 1000 / RAMPA_GUIA);
      const k = K_GUIA * tg * tg, c = 2 * Math.sqrt(k);      // amortecimento crítico
      tmp.subVectors(alvoGuia, b.p);
      b.v.addScaledVector(tmp, k * dt).addScaledVector(b.v, -c * dt);
      // comporta aberta + bola passando por ela → cai no tubo
      if (b.capturar && tmp.length() < R_CAPTURA) b.capturar();
    }
    b.v.y += G * dt;
    b.v.multiplyScalar(1 - ARRASTO * dt);
    b.p.addScaledVector(b.v, dt);

    tmp.set(b.p.x - CAGE_X[b.gaiola], b.p.y - CAGE_Y, b.p.z);
    const dist = tmp.length(), maxR = CAGE_R - BALL_R;
    if (dist > maxR) {
      n.copy(tmp).divideScalar(dist);
      b.p.set(CAGE_X[b.gaiola], CAGE_Y, 0).addScaledVector(n, maxR);
      const vn = b.v.dot(n);
      if (vn > 0) {
        b.v.addScaledVector(n, -(1 + REST_PAREDE) * vn);
        if (vn > 2) somImpacto(vn, b.gaiola);                   // bola × parede
      }
      vp.set(0, -gai.omega * tmp.z, gai.omega * tmp.y);   // ω × r
      vp.subVectors(b.v, vp);                              // velocidade relativa
      vp.addScaledVector(n, -vp.dot(n));                   // só a tangencial
      b.v.addScaledVector(vp, -ATRITO);
    }
    // Colisão com as esferas fixas (pinos) do tambor
    const minD = BALL_R + PINO_R;
    for (const pm of gai.pinosMundo) {
      tmp.set(b.p.x - CAGE_X[b.gaiola] - pm.x, b.p.y - CAGE_Y - pm.y, b.p.z - pm.z);
      const d = tmp.length();
      if (d > 0 && d < minD) {
        n.copy(tmp).divideScalar(d);
        b.p.addScaledVector(n, minD - d);
        vp.set(0, -gai.omega * pm.z, gai.omega * pm.y);  // velocidade do pino (ω × r)
        const rel = b.v.clone().sub(vp), vn = rel.dot(n);
        if (vn < 0) {
          b.v.addScaledVector(n, -(1 + REST_PINO) * vn);
          if (vn < -2) somImpacto(-vn, b.gaiola);                // bola × pino
        }
        rel.copy(b.v).sub(vp); rel.addScaledVector(n, -rel.dot(n));   // tangencial
        b.v.addScaledVector(rel, -ATRITO);
      }
    }
  }
  // Colisões bola-bola (até 11 bolas por gaiola → 55 pares) — v3.5.0:
  //   3 iterações por passo (amontoados se desfazem), impulso normal com
  //   e = 0,85 e atrito tangencial entre as bolas (μ ≈ 0,1 do impulso normal).
  for (let it = 0; it < ITER_BOLAS; it++) {
    for (let i = 0; i < bolas.length; i++) {
      const a = bolas[i]; if (!a.livre) continue;
      for (let j = i + 1; j < bolas.length; j++) {
        const b = bolas[j]; if (!b.livre || b.gaiola !== a.gaiola) continue;
        tmp.subVectors(b.p, a.p);
        const d = tmp.length(), min = BALL_R * 2;
        if (d > 0 && d < min) {
          n.copy(tmp).divideScalar(d);
          const corr = (min - d) / 2;
          a.p.addScaledVector(n, -corr); b.p.addScaledVector(n, corr);
          vp.subVectors(b.v, a.v);
          const rel = vp.dot(n);
          if (rel < 0) {
            if (it === 0 && rel < -2) somImpacto(-rel, a.gaiola);   // bola × bola
            const imp = -(1 + REST) * rel / 2;                       // massas iguais
            a.v.addScaledVector(n, -imp); b.v.addScaledVector(n, imp);
            // atrito tangencial (Coulomb simplificado): |Δv_t| ≤ 0,1·imp
            vp.addScaledVector(n, -rel);                             // componente tangencial
            const vt = vp.length();
            if (vt > 1e-6) {
              const dvt = Math.min(vt / 2, 0.1 * imp) / vt;
              a.v.addScaledVector(vp, dvt); b.v.addScaledVector(vp, -dvt);
            }
          }
        }
      }
    }
  }
}

/* ===========================================================================
 * ENQUADRAMENTO E CENTRALIZAÇÃO (v2.2.0)
 *
 *   Caixa da cena (unid. 3D): largura ±MEIA_LARG, altura de Y_BAIXO a Y_ALTO
 *   (da placa na mesa até a bola extraída no topo).
 *
 *   Área livre na tela: entre a barra superior (topo) e o painel (base).
 *     hLivre = base − topo
 *   Distância necessária para caber:
 *     pela largura: dW = MEIA_LARG / tan(hfov/2)
 *     pela altura : dH = MEIA_ALT / (tan(vfov/2) · hLivre/h)
 *     d = max(dW, dH) · margem
 *   Centralização: deslocamos o centro óptico com setViewOffset para que o
 *   centro da cena caia no centro da área livre, e não no centro da tela:
 *     offsetY = h/2 − (topo + base)/2   (positivo → cena sobe)
 *   Analogia: é como ajustar o trim do rebocador — o casco (cena) fica no
 *   mesmo lugar, só mudamos a linha d'água de referência (centro óptico).
 * ========================================================================= */
const MEIA_LARG = CAGE_X[2] + CAGE_R + 0.75;   // inclui manivela e colunas
// v3.0.0: a bola não sobe mais acima da gaiola (vai ao copo) → topo mais baixo.
const Y_BAIXO = PISO_Y - 0.25, Y_ALTO = CAGE_Y + CAGE_R + 0.5;
const FAIXA_Y = Y_ALTO + 0.9;                  // faixa logo acima, ao fundo
const MEIA_ALT = (Y_ALTO - Y_BAIXO) / 2, CENTRO_Y = (Y_ALTO + Y_BAIXO) / 2;

function enquadrar() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;

  // Área livre: entre a barra superior e o painel. Se o painel estiver em
  // coluna à direita (celular deitado), a área livre é a faixa à esquerda.
  const topo = document.querySelector('.topo').getBoundingClientRect().bottom;
  const pr = document.querySelector('.painel').getBoundingClientRect();
  const lateral = pr.left > w * 0.45 && pr.height > h * 0.5;
  const base = lateral ? h : pr.top - 8;
  const x0 = 0, x1 = lateral ? pr.left - 8 : w;
  const hLivre = Math.max(120, base - topo);
  const wLivre = Math.max(160, x1 - x0);

  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const dW = MEIA_LARG / (Math.tan(hfov / 2) * (wLivre / w));
  const dH = MEIA_ALT / (Math.tan(vfov / 2) * (hLivre / h));
  const d = Math.max(dW, dH) * 1.06;            // 6% de folga

  // Câmera levemente elevada (≈10°) olhando para o centro da cena.
  camera.position.set(0, CENTRO_Y + d * 0.17, d);
  camera.lookAt(0, CENTRO_Y, 0);

  // Deslocamento do centro óptico (positivo → cena vai para cima/esquerda):
  //   offsetX = w/2 − (x0 + x1)/2 ;  offsetY = h/2 − (topo + base)/2
  const offsetX = w / 2 - (x0 + x1) / 2;
  const offsetY = h / 2 - (topo + base) / 2;
  camera.setViewOffset(w, h, offsetX, offsetY, w, h);
  camera.updateProjectionMatrix();

  // Névoa acompanha a distância: nítido nas gaiolas, esmaecido só ao fundo.
  scene.fog.near = d + 2; scene.fog.far = d + 22;
}

function iniciar3D() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { webglOk = false; }
  if (!webglOk || !renderer.getContext()) {
    webglOk = false;
    $('palco').innerHTML = '<div class="semwebgl">Seu aparelho não suporta 3D.<br>O sorteio funciona normalmente pelo placar abaixo.</div>';
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  $('palco').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1d3b2a, 0.9));
  const sol = new THREE.DirectionalLight(0xffffff, 0.9); sol.position.set(4, 8, 6); scene.add(sol);
  const contra = new THREE.PointLight(0xffd36b, 0.6, 20); contra.position.set(0, 3, -4); scene.add(contra);

  // Névoa linear: objetos distantes fundem com o fundo (profundidade)
  scene.fog = new THREE.Fog(0x04190f, 14, 30);      // near/far reajustados em enquadrar()

  // Mesa: tampo de feltro verde + borda de madeira
  const tampo = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.1, 64),
    new THREE.MeshStandardMaterial({ color: 0x0e5a37, roughness: 0.95 }));
  tampo.scale.set(6.4, 1, 2.6); tampo.position.y = PISO_Y - 0.05; scene.add(tampo);
  const borda = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 10, 96),
    new THREE.MeshStandardMaterial({ color: 0x6b3f1d, roughness: 0.6, metalness: 0.1 }));
  borda.scale.set(6.4, 2.6, 1); borda.rotation.x = Math.PI / 2; borda.position.y = PISO_Y; scene.add(borda);
  const saia = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.96, 1.2, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x4a2a12, roughness: 0.8, side: THREE.DoubleSide }));
  saia.scale.set(6.4, 1, 2.6); saia.position.y = PISO_Y - 0.7; scene.add(saia);

  // Painel de fundo curvo (arco de cilindro visto por dentro) com a faixa
  const painel = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 1.4, 64, 1, true, -0.62, 1.24),
    new THREE.MeshBasicMaterial({ map: texturaFaixa(), side: THREE.BackSide, fog: false }));
  painel.position.set(0, FAIXA_Y, 4); painel.rotation.y = Math.PI; scene.add(painel);

  for (let i = 0; i < 3; i++) criarGaiola(i);
  enquadrar();
  addEventListener('resize', enquadrar);
  // O painel muda de altura quando o resultado aparece: recentraliza a cena.
  if (window.ResizeObserver) new ResizeObserver(() => enquadrar()).observe(document.querySelector('.painel'));

  let acum = 0, ultimo = performance.now(), acumTubo = 0, ultimoTubo = 0;
  renderer.setAnimationLoop((agora) => {
    const dtReal = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
    // Velocidade angular segue o alvo com resposta de 1ª ordem:
    //   ω ← ω + (ω_alvo − ω)·(1 − e^(−dt/τ)),  τ ≈ 0,4 s (inércia do tambor)
    for (const g of gaiolas) {
      g.omega += (g.alvo - g.omega) * (1 - Math.exp(-dtReal / 0.4));
      // Entorno: foco suave (mesma resposta de 1ª ordem, τ = 0,25 s)
      g.foco += (g.focoAlvo - g.foco) * (1 - Math.exp(-dtReal / 0.25));
      const pulso = 0.5 + 0.5 * Math.sin(agora / 180);
      const f = Math.max(0, g.foco);
      g.holofote.intensity = 2.2 * f;
      g.aro.material.emissive.setHex(g.aro.material.color.getHex());
      g.aro.material.emissiveIntensity = f * (0.35 + 0.45 * pulso);
      g.giro.children[0].material.opacity = 0.55 - 0.3 * Math.max(0, -g.foco); // esmaece as fora de foco
      g.podio.material.opacity += (g.podioAlvo - g.podio.material.opacity) * (1 - Math.exp(-dtReal / 0.2));
      g.podio.rotation.z += dtReal * 1.5;
    }
    acum += dtReal;
    while (acum >= DT) { passoFisica(DT); acum -= DT; }
    // Tubo em TEMPO REAL (sem o limite de 0,05 s): mesmo num aparelho lento a
    // bola chega ao copo no horário — t ≈ 0,8 s na geometria atual.
    acumTubo += Math.min(0.25, (agora - (ultimoTubo || agora)) / 1000); ultimoTubo = agora;
    while (acumTubo >= DT) { passoTubo(DT); acumTubo -= DT; }
    for (const g of gaiolas) g.giro.rotation.x = g.ang;
    for (const [b, e] of tubo) {                     // bolas no tubo / no copo
      b.mesh.position.copy(e.pos);
      if (e.chegou) {
        e.tc = Math.min(1, e.tc + dtReal / 0.35);
        b.mesh.quaternion.slerp(Q0, e.tc * 0.25);    // assenta com o número para a câmera
        b.mesh.scale.setScalar(1 + 0.6 * e.tc);      // lupa de vidro sobre o copo
      }
    }
    for (const b of bolas) {
      if (!b.livre) continue;
      b.mesh.position.copy(b.p);
      // Rolagem visual: ângulo = deslocamento / raio
      b.mesh.rotation.x += (b.v.z / BALL_R) * dtReal;
      b.mesh.rotation.z -= (b.v.x / BALL_R) * dtReal;
    }
    renderer.render(scene, camera);
  });
}

/* ===========================================================================
 * EXTRAÇÃO FÍSICA PELO TUBO (v3.0.0)
 *   conduzir(i, d)  : durante a frenagem, a bola d é levada à comporta.
 *   extrairBola(...) : a comporta abre; a bola entra no tubo e ROLA até o copo.
 *
 *   Movimento no tubo (1D, ao longo do comprimento s da curva):
 *     esfera maciça rolando sem deslizar → I = (2/5)·m·r²
 *     a_s = g·sen θ · m/(m + I/r²) = (5/7)·g·sen θ        (sen θ = −dy/ds)
 *     − resistência ao rolamento: a −= C_ROL·v
 *   C_ROL = 0,25 s⁻¹ ; comporta abre 1,0 s antes da revelação ; trajeto
 *   L ≈ 1,67 → t ≈ 0,8 s (simulado), chegando ~0,2 s antes do placar.
 *   Ex.: rampa de 10° → a = (5/7)·9·0,17 ≈ 1,1 m/s². A queda inicial da
 *   comporta (≈ 0,35) dá v ≈ √(2·(5/7)·9·0,35) ≈ 2,1 m/s de entrada.
 *   Analogia: é a água descendo pela calha de um convés inclinado — a
 *   inclinação dá a aceleração, o atrito tira um pouco de energia.
 *   O número sorteado vem do servidor (sorteio criptográfico); a física
 *   decide a mistura e o trajeto, não o resultado.
 * ========================================================================= */
const tubo = new Map();                 // bola → estado no tubo
const C_ROL = 0.25, Q0 = new THREE.Quaternion(), EIXO = new THREE.Vector3(), TAN = new THREE.Vector3(), CIMA = new THREE.Vector3(0, 1, 0), QD = new THREE.Quaternion();

function conduzir(gaiolaIdx, digito) {
  const b = bolas.find((x) => x.gaiola === gaiolaIdx && x.digito === digito);
  if (b && b.livre) b.guia = performance.now();
}

function passoTubo(dt) {
  for (const [b, e] of tubo) {
    if (e.chegou) continue;
    const g = gaiolas[b.gaiola], u = Math.min(1, e.s / g.comprimento);
    g.caminho.getTangentAt(u, TAN);
    e.v += ((5 / 7) * -G * -TAN.y - C_ROL * e.v) * dt;   // −TAN.y = sen θ (descida)
    e.v = Math.max(e.v, 0.5);                           // não volta para dentro da gaiola
    e.s += e.v * dt;
    if (e.s >= g.comprimento) { e.s = g.comprimento; e.chegou = true; e.tc = 0; somImpacto(Math.max(6, e.v), b.gaiola); e.resolver(); }
    g.caminho.getPointAt(Math.min(1, e.s / g.comprimento), e.pos).add(g.grupo.position);
    // rolagem: eixo = tangente × vertical ; ângulo = ds / r
    EIXO.crossVectors(TAN, CIMA).normalize();
    if (EIXO.lengthSq() > 0) b.mesh.quaternion.premultiply(QD.setFromAxisAngle(EIXO, -(e.v * dt) / BALL_R));
  }
}

function extrairBola(gaiolaIdx, digito, duracaoMs = 900 * T) {
  return new Promise((resolve) => {
    if (!webglOk) return resolve();
    const b = bolas.find((x) => x.gaiola === gaiolaIdx && x.digito === digito);
    if (!b) return resolve();                          // defensivo: dígito sem bola
    const g = gaiolas[gaiolaIdx];
    const e = { s: 0, v: 0.8, pos: new THREE.Vector3(), chegou: false, tc: 0, resolver: resolve };
    if (duracaoMs <= 50) {                             // visitante atrasado: já está no copo
      b.livre = false; b.guia = false;
      e.s = g.comprimento; e.chegou = true; e.tc = 1;
      g.caminho.getPointAt(1, e.pos).add(g.grupo.position);
      b.mesh.quaternion.identity(); b.mesh.scale.setScalar(1.6);
      tubo.set(b, e); return resolve();
    }
    // Comporta aberta: a bola continua livre (misturando) até passar por ela.
    const entrar = (motivo = 'passagem') => {
      if (!b.livre) return;
      e.motivo = motivo;
      b.capturar = null; b.livre = false; b.guia = false;
      e.v = Math.min(5, Math.max(1.5, b.v.length()));     // entra com a própria velocidade
      b.v.set(0, 0, 0);
      g.caminho.getPointAt(0, e.pos).add(g.grupo.position);
      tubo.set(b, e);
    };
    if (!b.guia) b.guia = performance.now() - RAMPA_GUIA * 1000;   // sem condução prévia (teste)
    b.capturar = entrar;
    setTimeout(() => entrar('limite'), 450);           // limite de segurança do horário
  });
}

// Devolve a bola (auditoria) por cima da gaiola: sai do copo, sobe em arco e
// é solta no topo interno — a partir daí volta a obedecer à física.
function devolverBola(b) {
  if (!b) return;
  const e = tubo.get(b); tubo.delete(b);
  const ini = (e ? e.pos : b.mesh.position).clone();
  const fim = new THREE.Vector3(CAGE_X[b.gaiola], CAGE_Y + CAGE_R - BALL_R - 0.1, 0);
  const t0 = performance.now(), dur = 600 * T;
  b.mesh.scale.setScalar(1);
  (function quadro(agora) {
    const k = Math.min(1, (agora - t0) / dur);
    b.mesh.position.lerpVectors(ini, fim, k); b.mesh.position.y += Math.sin(Math.PI * k) * 0.8;
    if (k < 1) return requestAnimationFrame(quadro);
    b.p.copy(fim); b.v.set(0, -2, 0); b.livre = true; b.guia = false;   // cai pela gravidade
  })(t0);
}

/* ===========================================================================
 * CONFETE (canvas 2D simples)
 * ========================================================================= */
function confete() {
  if (REDUZIR) return;
  const cv = $('confete'), g = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const cores = ['#1565C0', '#00a35f', '#f2b705', '#ffffff'];
  const p = Array.from({ length: 160 }, () => ({
    x: cv.width / 2, y: cv.height * 0.45, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
    s: 4 + Math.random() * 6, c: cores[(Math.random() * 4) | 0], a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.4,
  }));
  const t0 = performance.now();
  (function quadro(agora) {
    g.clearRect(0, 0, cv.width, cv.height);
    for (const q of p) {
      q.vy += 0.35; q.vx *= 0.99; q.x += q.vx; q.y += q.vy; q.a += q.va;
      g.save(); g.translate(q.x, q.y); g.rotate(q.a); g.fillStyle = q.c; g.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); g.restore();
    }
    if (agora - t0 < 3500) requestAnimationFrame(quadro); else g.clearRect(0, 0, cv.width, cv.height);
  })(t0);
}

/* ===========================================================================
 * CARTELA — consulta quem comprou (usada no modo teste e no ensaio)
 * ========================================================================= */
async function consultarCartela() {
  try {
    const r = await fetch(API_NUM, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.total) { TOTAL = d.total; $('totalTxt').textContent = pad(TOTAL); }
    if (d.sold) return d.sold;
    // Formato do sistema em produção (v2.6.0): { "007": { phoneMasked:"***-8849", status } }
    const out = {};
    for (const [k, v] of Object.entries(d)) {
      if (/^\d{3}$/.test(k) && v && v.status !== 'held') out[+k] = { name: 'comprador ' + (v.phoneMasked || '') };
    }
    return out;
  } catch { return null; }
}

/* ===========================================================================
 * PLACAR E RESULTADO (comuns aos modos oficial, ensaio e teste)
 * ========================================================================= */
const historico = [];

function limparPlacar() {
  for (let i = 0; i < 3; i++) { const d = $('d' + i); d.textContent = '–'; d.className = 'digito vazio'; }
  $('resultado').textContent = '';
  $('destaque').classList.remove('on');
}

function mostrarDigito(i, dig, animar = true) {
  const d = $('d' + i);
  d.textContent = dig; d.className = 'digito' + (animar ? ' pop' : '');
  if (animar) somRevela(i);
}

function mostrarAuditoria(i, mostrar) {
  const dA = $('d' + i);
  if (mostrar) {
    dA.textContent = AUDITORIA; dA.className = 'digito auditoria pop';
    $('status').textContent = `Bola de AUDITORIA na ${ROTULOS[i].toLowerCase()} — devolvida à gaiola`;
    tom(330, 0.25, 'sawtooth', 0.08); tom(262, 0.3, 'sawtooth', 0.08, 0.15);
  } else {
    dA.textContent = '–'; dA.className = 'digito vazio';
  }
}

/* Final: número em destaque + ganhador (nome e 4 últimos dígitos do telefone).
 *   ganhador === undefined → ainda sem apuração (mostra só o número)
 *   ganhador === null      → número não comprado
 *   ganhador.telefoneFinal → "tel. final 1234" */
function mostrarFinal(numero, ganhador, auditorias, celebrar = true) {
  const txt = pad(numero);
  if (celebrar) {
    $('destaque').textContent = txt;
    $('destaque').classList.add('on');
    somFinal(); confete();
    setTimeout(() => $('destaque').classList.remove('on'), 2600 * T + 400);
  }
  const res = $('resultado');
  res.replaceChildren();
  const linha1 = document.createElement('div');
  linha1.append('Número sorteado: ');
  const nb = document.createElement('strong'); nb.textContent = txt; linha1.append(nb);
  res.append(linha1);

  const linha2 = document.createElement('div');
  linha2.className = 'ganhador';
  if (ganhador === undefined) {
    linha2.textContent = 'Apurando o ganhador…';
  } else if (ganhador === null) {
    linha2.textContent = 'Número não comprado — sem ganhador nesta extração.';
  } else {
    linha2.append('🏆 Ganhador(a): ');
    const g = document.createElement('strong'); g.textContent = ganhador.nome; linha2.append(g);
    if (ganhador.telefoneFinal) linha2.append(` • tel. final ${ganhador.telefoneFinal}`);
  }
  res.append(linha2);

  if (auditorias) {
    const tot = auditorias.reduce((a, b) => a + b, 0);
    const sm = document.createElement('small');
    sm.textContent = tot
      ? `Auditorias: ${tot} (centena ${auditorias[0]}, dezena ${auditorias[1]}, unidade ${auditorias[2]})`
      : 'Auditorias: nenhuma';
    res.append(sm);
  }
  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  historico.unshift(`${txt} • ${hora}` + (ganhador ? ` • ${ganhador.nome}` : ''));
  $('listaHist').replaceChildren(...historico.slice(0, 30).map((h) => {
    const li = document.createElement('li'); li.textContent = h; return li;
  }));
}

/* ===========================================================================
 * RELÓGIO SINCRONIZADO COM O SERVIDOR
 *   Estimativa estilo NTP: o servidor carimba `agora` no meio da viagem, então
 *     offset ≈ agoraServidor − (t_envio + t_retorno)/2
 *   Erro máximo ≈ metade do tempo de ida e volta (tipicamente < 0,2 s).
 *   Guardamos o offset da medição com MENOR ida-e-volta (mais precisa).
 *   Analogia: é acertar o cronômetro de bordo pelo sinal horário do rádio,
 *   descontando o atraso de propagação.
 * ========================================================================= */
let offset = 0, melhorRTT = Infinity;
const agoraSync = () => Date.now() + offset;
const ate = (tServ) => new Promise((r) => setTimeout(r, Math.max(0, tServ - agoraSync())));

/* ===========================================================================
 * FONTES DE DADOS
 *   oficial : API /sorteio (resultado único gerado no servidor)
 *   ensaio  : ?ensaio=1 — mesmo roteiro, comprimido e começando em 5 s,
 *             com resultado gerado localmente (não oficial)
 * ========================================================================= */
const API_SORTEIO = '/.netlify/functions/sorteio';
const MODO_ENSAIO = new URLSearchParams(location.search).get('ensaio') === '1';

async function buscarOficial() {
  const t0 = Date.now();
  const r = await fetch(API_SORTEIO, { cache: 'no-store' });
  const t1 = Date.now();
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const d = await r.json();
  if (t1 - t0 < melhorRTT) { melhorRTT = t1 - t0; offset = d.agora - (t0 + t1) / 2; }
  return d;
}

// Ensaio: reproduz localmente a mesma lógica de liberação do servidor.
let ensaio = null;
async function buscarEnsaio() {
  if (!ensaio) {
    const inicio = Date.now() + 5000, fim = inicio + 45000;
    const numero = sortearNumero(TOTAL);
    const aud = [2, 10, 10].map((k) => { let a = 0; while (a < 2 && sortearNumero(k + 1) === k + 1) a++; return a; });
    ensaio = { agenda: { inicio, t: [fim - 20000, fim - 10000, fim], fim }, numero, aud,
               digitos: pad(numero).split('').map(Number), cartelaP: consultarCartela() };
  }
  const e = ensaio, agora = Date.now(), ciclo = { auditoriaMs: 4000, extracaoMs: 1800 };
  const out = { agora, agenda: e.agenda, ciclo, gaiolas: [null, null, null],
                fase: agora < e.agenda.inicio ? 'aguardando' : agora < e.agenda.fim ? 'ao-vivo' : 'encerrado' };
  for (let i = 0; i < 3; i++) {
    if (agora >= e.agenda.t[i] - (ciclo.extracaoMs + ciclo.auditoriaMs * e.aud[i])) {
      out.gaiolas[i] = { digito: e.digitos[i], auditorias: e.aud[i] };
    }
  }
  if (agora >= e.agenda.fim) {
    const vend = await e.cartelaP;
    out.numero = e.numero;
    out.ganhador = vend && vend[e.numero] ? { nome: vend[e.numero].name + ' (ensaio)', telefoneFinal: '0000' } : null;
  }
  return out;
}
const buscar = () => (MODO_ENSAIO ? buscarEnsaio() : buscarOficial());

/* ===========================================================================
 * ANIMAÇÃO SINCRONIZADA DE UMA GAIOLA
 *   Início S = T_i − (extração + ciclo·a)   (mesma fórmula do servidor)
 *   Ciclo de auditoria (4,0 s): frear 0,9 → extrair 0,9 → exibir 1,0 → girar 1,2
 *   Final (1,8 s): frear 0,9 → extrair 0,9 → revela EXATAMENTE em T_i.
 *   Todos os passos usam horários ABSOLUTOS do servidor (ate(t)), então
 *   atrasos de um quadro não se acumulam entre um passo e outro.
 *   Se o visitante chegou depois de T_i, revela na hora, sem animação.
 * ========================================================================= */
const gaiolaFeita = [false, false, false];

async function animarGaiola(i, g, Ti, ciclo, local = false) {
  if (!local) {                                      // oficial: cada gaiola uma única vez
    if (gaiolaFeita[i]) return;
    gaiolaFeita[i] = true;
  }
  const C = ciclo.auditoriaMs, X = ciclo.extracaoMs;
  const S = Ti - (X + C * g.auditorias);

  if (agoraSync() >= Ti - 200) {                     // chegou atrasado: revela direto
    gaiolas[i] && (gaiolas[i].alvo = 0, gaiolas[i].podioAlvo = 0.9);
    await extrairBola(i, g.digito, 1);
    mostrarDigito(i, g.digito, false);
    return;
  }
  await ate(S);
  $('status').textContent = `Sorteando a ${ROTULOS[i].toLowerCase()}…`;
  focarGaiola(i);
  for (let a = 0; a < g.auditorias; a++) {
    const Ca = S + a * C;
    if (gaiolas[i]) { gaiolas[i].alvo = 0; gaiolas[i].podioAlvo = 0.9; }
    conduzir(i, AUDITORIA);
    await ate(Ca + 900);
    extrairBola(i, AUDITORIA);
    falar('voz-auditoria');
    await ate(Ca + 1800);
    mostrarAuditoria(i, true);
    await ate(Ca + 2800);
    devolverBola(bolas.find((x) => x.gaiola === i && x.digito === AUDITORIA));
    mostrarAuditoria(i, false);
    $('status').textContent = `Girando a ${ROTULOS[i].toLowerCase()} novamente…`;
    if (gaiolas[i]) { gaiolas[i].podioAlvo = 0; gaiolas[i].alvo = OMEGA_GIRO; }
    await ate(Ca + C);
  }
  if (gaiolas[i]) { gaiolas[i].alvo = 0; gaiolas[i].podioAlvo = 0.9; }
  conduzir(i, g.digito);
  falar(['voz-centena', 'voz-dezena', 'voz-unidade'][i]);
  await ate(Ti - 1200);                               // comporta abre; captura ≤ 0,45 s + ~0,65 s de tubo
  extrairBola(i, g.digito, Math.max(100, Ti - agoraSync()));
  await ate(Ti);
  mostrarDigito(i, g.digito, true);
}

/* ===========================================================================
 * CICLO DO SORTEIO OFICIAL
 *   aguardando : contagem regressiva até 09:50 (gaiolas paradas)
 *   ao-vivo    : gaiolas girando; consulta o servidor com frequência maior
 *                perto de cada revelação (1 s nos últimos 12 s antes de T1)
 *   encerrado  : mostra número e ganhador (nome + tel. final)
 * ========================================================================= */
const fmtData = (ms) => new Date(ms).toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtHora = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });

function fmtFalta(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  const hms = [h, m, x].map((v) => String(v).padStart(2, '0')).join(':');
  return d ? `${d}d ${hms}` : hms;
}

let dados = null, girando = false, finalMostrado = false;

function atualizarRelogio() {
  if (demoAgenda) {                                  // contagem da demonstração/teste
    const agora = agoraSync(), k = demoAgenda.t.findIndex((t) => agora < t);
    $('relogio').textContent = k < 0 ? '' : `${demoAgenda.rot}: ${ROTULOS[k]} em ${fmtFalta(demoAgenda.t[k] - agora)}`;
    return;
  }
  if (!dados) return;
  const ag = dados.agenda, agora = agoraSync();
  const prox = [[ag.inicio, 'Gaiolas começam a girar em'], [ag.t[0], 'Centena em'], [ag.t[1], 'Dezena em'], [ag.t[2], 'Resultado em']]
    .find(([t]) => agora < t);
  if (!sorteando) atualizarDemo();
  if (agora < ag.inicio) {
    if (!sorteando) $('status').textContent = statusEspera();
  } else if (!girando && agora < ag.fim) {
    girando = true;
    gaiolas.forEach((g, i) => { if (!gaiolaFeita[i]) g.alvo = OMEGA_GIRO + i * 0.4; });
    $('status').textContent = '🔴 AO VIVO — gaiolas girando';
    querTrilha(true);
    if (agora - ag.inicio < 15000) falar('voz-abertura');   // só para quem está assistindo no início
  }
  $('relogio').textContent = prox ? `${prox[1]} ${fmtFalta(prox[0] - agora)}` : '';
}

async function cicloOficial() {
  try {
    dados = await buscar();
    if (dados.fase !== 'encerrado' && !finalMostrado) querTrilha(true);   // música até o sorteio
    atualizarDemo();
  } catch (e) {
    $('status').textContent = 'Sem conexão com o servidor do sorteio. Tentando novamente…';
    return setTimeout(cicloOficial, 5000);
  }
  const ag = dados.agenda, agora = agoraSync();
  $('relogioBox').hidden = false;

  // Gaiolas liberadas → agenda a animação de cada uma (só uma vez).
  dados.gaiolas.forEach((g, i) => { if (g) animarGaiola(i, g, ag.t[i], dados.ciclo); });

  // Resultado final apurado
  if (dados.numero != null && !finalMostrado) {
    finalMostrado = true;
    const jaPassou = agora - ag.fim > 15000;           // visitante chegou bem depois
    await ate(ag.fim + (jaPassou ? 0 : 400));
    gaiolas.forEach((g) => (g.alvo = 0));
    focarGaiola(null);
    const aud = dados.gaiolas.map((g) => (g ? g.auditorias : 0));
    mostrarFinal(dados.numero, dados.ganhador, aud, !jaPassou);
    if (!jaPassou) {
      // Agradecimento (voz do Jossian) só quando há ganhador; trilha sai em fade.
      if (dados.ganhador) setTimeout(() => falar('voz-agradecimento'), 3500);
      setTimeout(() => querTrilha(false), dados.ganhador ? 9000 : 5000);
    } else querTrilha(false);
    $('status').textContent = 'Sorteio concluído';
    $('relogio').textContent = `Resultado oficial de ${fmtData(ag.fim)}`;
    return;                                             // fim do ciclo
  }

  // Próxima consulta: mais frequente perto dos momentos de revelação.
  let espera_ms;
  if (agora < ag.inicio - 60000) espera_ms = Math.min(60000, ag.inicio - 60000 - agora + 500);
  else if (agora < ag.t[0] - 12000) espera_ms = Math.min(15000, ag.t[0] - 12000 - agora + 50);
  else espera_ms = 1000;
  setTimeout(cicloOficial, Math.max(500, espera_ms));
}

/* ===========================================================================
 * MODO TESTE (?teste=1) — sorteio manual local, NÃO oficial
 * ========================================================================= */
let sorteando = false;
async function sortearTeste(demo = false) {
  if (sorteando || !(MODO_TESTE || demo)) return;
  if (demo && !demoPermitida()) return;
  sorteando = true;
  const ROT = demo ? 'DEMONSTRAÇÃO' : 'TESTE';
  const btn = demo ? $('btnDemo') : $('btnSortear'); btn.disabled = true;
  limparPlacar();
  bolas.forEach((b) => { if (!b.livre) reposicionar(b); });
  gaiolas.forEach((g) => (g.podioAlvo = 0));
  const cartelaP = demo ? Promise.resolve(null) : consultarCartela();
  const numero = sortearNumero(TOTAL);
  const digs = pad(numero).split('').map(Number);
  // v3.4.0: agenda local — quedas aos 30 s, 40 s e 50 s após o início do giro.
  //   T_i = t0 + {30, 40, 50} s ; auditorias como no oficial (máx. 2 por gaiola,
  //   P = 1/(k+1)), cada uma consumindo 4,0 s ANTES da queda daquela gaiola.
  const auditorias = [2, 10, 10].map((k) => { let a = 0; while (a < 2 && sortearNumero(k + 1) === k + 1) a++; return a; });
  const t0 = agoraSync();
  const Ts = DEMO_QUEDAS_S.map((x) => t0 + x * 1000);
  demoAgenda = { t: Ts, rot: ROT };
  $('relogioBox').hidden = false;
  $('status').textContent = `${ROT} — girando as gaiolas…`;
  querTrilha(true);
  if (!demo) falar('voz-abertura');                   // "sorteio oficial" só no teste
  gaiolas.forEach((g, i) => (g.alvo = OMEGA_GIRO + i * 0.4));
  const ciclo = { auditoriaMs: 4000, extracaoMs: 1800 };
  await Promise.all([0, 1, 2].map((i) => animarGaiola(i, { digito: digs[i], auditorias: auditorias[i] }, Ts[i], ciclo, true)));
  demoAgenda = null;
  $('relogio').textContent = '';
  gaiolas.forEach((g) => (g.alvo = 0)); focarGaiola(null);
  const vend = await cartelaP;
  const ganhador = vend === null ? undefined : (vend[numero] ? { nome: vend[numero].name } : null);
  if (demo) {
    // Demonstração: sem ganhador, aviso claro e bolas de volta às gaiolas.
    $('destaque').textContent = pad(numero); $('destaque').classList.add('on'); somFinal();
    setTimeout(() => $('destaque').classList.remove('on'), 2200);
    const res = $('resultado'); res.replaceChildren();
    const l1 = document.createElement('div'); l1.append('Demonstração: '); const nb = document.createElement('strong'); nb.textContent = pad(numero); l1.append(nb);
    const l2 = document.createElement('div'); l2.className = 'ganhador'; l2.textContent = 'Não é o resultado oficial.';
    const sm = document.createElement('small'); sm.textContent = 'Sorteio oficial: 23/12/2026 às 10h (horário de Brasília).';
    res.append(l1, l2, sm);
    $('status').textContent = 'DEMONSTRAÇÃO concluída';
    await espera(8000);
    limparPlacar();
    bolas.forEach((b) => { if (!b.livre) devolverBola(b); });
    gaiolas.forEach((g) => (g.podioAlvo = 0));
    $('status').textContent = statusEspera();
    btn.textContent = '▶️ Ver demonstração novamente';
    btn.disabled = false; sorteando = false;
    atualizarDemo();
    return;
  }
  mostrarFinal(numero, ganhador, auditorias);
  $('status').textContent = 'TESTE concluído (não oficial)';
  if (ganhador) setTimeout(() => falar('voz-agradecimento'), 3500);
  setTimeout(() => querTrilha(false), ganhador ? 9000 : 5000);
  btn.textContent = 'Sortear novamente (teste)';
  btn.disabled = false;
  sorteando = false;
}

/* ---------- Demonstração: só antes do sorteio oficial (até inicio − 2 min) ---------- */
const DEMO_QUEDAS_S = [30, 40, 50];                 // centena, dezena, unidade (s após o giro)
let demoAgenda = null;
function demoPermitida() {
  if (MODO_TESTE && !MODO_ENSAIO) return true;
  return !!dados && dados.fase === 'aguardando' && dados.agenda.inicio - agoraSync() > 120000;
}
function statusEspera() {
  return dados ? `${MODO_ENSAIO ? 'ENSAIO' : 'Sorteio oficial'}: ${fmtData(dados.agenda.fim)} (horário de Brasília)` : '';
}
function atualizarDemo() {
  const b = $('btnDemo'); if (!b) return;
  b.hidden = !(demoPermitida() || sorteando);
}

/* ===========================================================================
 * CONTROLES
 * ========================================================================= */
$('btnSortear').addEventListener('click', () => sortearTeste(false));
$('btnDemo').addEventListener('click', () => sortearTeste(true));
addEventListener('keydown', (e) => {
  if (MODO_TESTE && (e.code === 'Space' || e.key === 'Enter') && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
    e.preventDefault(); sortearTeste(false);
  }
});
$('btnSom').addEventListener('click', (e) => {
  somLigado = !somLigado;
  if (!somLigado) { try { vozAtual && vozAtual.stop(); } catch {} pararTrilha(1); }
  else { if (!audioLiberado) ativarSom(); else if (trilhaDesejada) iniciarTrilha(); }
  e.currentTarget.textContent = somLigado ? '🔊' : '🔇';
  e.currentTarget.setAttribute('aria-pressed', String(somLigado));
  e.currentTarget.setAttribute('aria-label', somLigado ? 'Desligar som' : 'Ligar som');
});
$('btnHist').addEventListener('click', () => { const h = $('historico'); h.hidden = !h.hidden; });
$('btnTela').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
});

$('ativarSom').addEventListener('click', ativarSom);

iniciar3D();
if (MODO_TESTE && !MODO_ENSAIO) {
  $('status').textContent = 'MODO TESTE — sorteio manual, não oficial';
  consultarCartela(); querTrilha(true);
  setInterval(atualizarRelogio, 250);
} else {
  consultarCartela();
  cicloOficial();
  setInterval(atualizarRelogio, 250);
}
