# GDD — Rifa Solidária Chico da Baixa (Game/Design Document)

- **Autor:** Jossian Brito
- **Versão do documento:** 2.5.0
- **Data/Hora:** 2026-11-16 13:00 (BRT, UTC-3)

## 1. Visão
Rifa beneficente online, transparente e sem atrito no celular: o comprador escolhe um
número, paga via Pix e vê a cartela atualizar em tempo real para todos.

## 2. Regras de negócio
| Item | Valor |
|------|-------|
| Números | **199** (001 a 199) — corrigido na v2.0.0 (antes: 200 e "000 a 200") |
| Preço | R$ 20,00 por número (Pix Copia e Cola) |
| Sorteio | **Oficial pelas gaiolas**: 23/12/2026, resultado às 10:00 (Brasília) |
| Encerramento das compras | 23/12/2026 09:50:00 (cartela bloqueada; encerrar também no painel) |
| Loteria Federal | **Oculta** (v2.0.0), conteúdo preservado para reativação |

## 3. Telas
1. **Cartela (`index.html`)** — contadores (Disponíveis, Vendidos, Online, Visitas),
   prêmios, grade 001–199, modal de compra com Pix e contagem de 15 min.
2. **Regras (`regras.html`)** — regras gerais; seção Loteria Federal oculta.
3. **Gaiola 3D (`sorteio.html`)** — três gaiolas: Centena (azul) 0, 1 + A; Dezena (verde) 0–9 + A;
   Unidade (amarela) 0–9 + A. "A" = bola vermelha de AUDITORIA.

## 4. Gaiola 3D
### 4.1 Física (inalterada na v2.1.0)
- Gravidade + arrasto: `v ← v + g·dt`, `v ← v·(1 − k·dt)`, g = −9, k = 0,35.
- Parede esférica de raio `R − r`: reflexão `v ← v − (1+e)(v·n)n`, e = 0,55.
- Arraste da parede móvel: `v_parede = ω × r`; atrito tangencial μ = 0,25
  (análogo à camada-limite junto ao casco).
- Inércia do tambor: `ω ← ω + (ω_alvo − ω)(1 − e^(−dt/τ))`, τ = 0,4 s.
- Passo fixo 1/240 s.

### 4.1.0 Escala física (v3.5.0)
- 1 unidade ≈ 0,1 m (gaiola R = 1,45 un ≈ 0,15 m). g = 98 un/s² (= 9,8 m/s²). Passo 1/480 s.
- Restituição: bola-bola 0,85; parede 0,70; pinos/aletas 0,70. Atrito de contato τ = 8 ms.
- Colisão bola-bola: 3 iterações por passo + atrito tangencial (≤ 0,1·impulso normal).
- 4 aletas a 0,80·R + 6 pinos a 0,62·R; ω = 9 rad/s (≈ 86 rpm).
- Medido (física pura): v média 11 un/s (1,1 m/s), 47% das bolas na metade de cima,
  ~50 choques bola-bola/s, 0 bolas fora, captura natural 28/30.

### 4.1.1 Mistura e tubo de saída (v3.0.0)
- 6 esferas fixas (r = 0,13) presas ao tambor, em anel de raio 0,62·R, alternando ±0,38·R em x;
  colisão bola-pino com a lei da parede (reflexão e = 0,6 + arraste ω × r). Ângulo do tambor
  integrado no passo físico (1/240 s).
- Frenagem (v3.1.0): condução suave k(t) = 80·min(1, t/0,8)², c = 0,7·2√k → as bolas seguem misturando
  pela inércia; comporta abre 1,2 s antes da revelação e captura a bola quando ela passa (raio 0,30),
  com a própria velocidade; limite de segurança de 0,45 s (~70% de captura natural, física pura).
- Comporta abre 1,0 s antes da revelação; no tubo a bola rola: a = (5/7)·g·sen θ − 0,25·v;
  L ≈ 1,67 → t ≈ 0,75 s. Copo com lupa (ampliação 1,6×) na frente da base.
- Auditoria: volta por cima da gaiola e cai pela gravidade.
- O número continua vindo do servidor; a física decide mistura e trajeto.

### 4.2 Sorteio
`crypto.getRandomValues` + rejeição de `x ≥ ⌊2³²/N⌋·N` → uniforme exato em 1..N.
A bola extraída corresponde ao dígito sorteado.

### 4.2.1 Bola de auditoria (v2.4.0)
- Cada gaiola tem uma bola vermelha "A". Se ela sair: é exibida (placar vermelho),
  registrada, devolvida à gaiola, e a gaiola gira de novo até sair um dígito.
- P(auditoria por extração) = 1/(k+1): centena 1/3, dezena/unidade 1/11.
  Média de auditorias por gaiola = 1/k: centena 0,5; dezena/unidade 0,1.
- Os eventos de auditoria são sorteados à parte (crypto) e não alteram a chance de
  nenhum bilhete: o resultado continua uniforme em 001..199.
- Limite de 6 auditorias seguidas por gaiola (só para não prender a tela).
- O total de auditorias aparece sob o resultado e no histórico (modo teste).
- Vermelho é exclusivo da auditoria; por isso a Centena passou a ser azul.

### 4.2.2 Sorteio oficial agendado (v2.5.0)
| Instante | Evento |
|---|---|
| T3 − 600 s (09:50:00) | gaiolas giram; compras encerradas |
| T1 − 10 s (09:59:30) | servidor gera número + auditorias (uma vez, onlyIfNew) |
| T1 (09:59:40) | centena revelada |
| T2 (09:59:50) | dezena revelada |
| T3 (10:00:00) | unidade revelada; apuração; nome + tel. final; e-mail |

- Liberação da gaiola i: `S_i = T_i − (1,8 s + 4,0 s·a_i)`, a_i ≤ 2 → S_i > T_(i−1).
- Ciclo de auditoria (4,0 s): frear 0,9 → extrair 0,9 → exibir 1,0 → girar 1,2.
- Relógio do cliente: `offset = agoraServidor − (t_envio + t_retorno)/2` (menor RTT).
- E-mail idempotente: reserva por CAS (`enviando` → `enviado`); nova tentativa após 2 min em caso de erro.
- Ensaio `?ensaio=1` e teste manual `?teste=1` (não oficiais).

### 4.3 Entorno (v2.1.0)
- Mesa com feltro verde, borda e saia de madeira; névoa linear (14–30).
- Painel de fundo curvo com a faixa "RIFA SOLIDÁRIA • CHICO DA BAIXA".
- Suporte por gaiola: base elíptica, colunas em "A" (θ = atan(abertura/altura)),
  mancais, eixo e manivela que gira junto com o tambor.
- Aros: dois meridianos cruzados a ±45° em torno do eixo de giro (v2.3.0); vistos de frente
  são elipses com semi-eixo vertical R·cos 45° ≈ 0,71·R, nunca de perfil.
- Placa frontal: CENTENA 0–1 / DEZENA 0–9 / UNIDADE 0–9.
- Sombra de contato por gradiente radial (sem shadow map → leve no celular).
- Foco: holofote dedicado + aro com brilho pulsante na gaiola em sorteio; as outras
  esmaecem (resposta de 1ª ordem, τ = 0,25 s).
- Pódio: anel luminoso sob a bola extraída.

### 4.4 Centralização e modo teste (v2.2.0)
- A cena é enquadrada pela largura **e** pela altura da área livre (entre a barra
  superior e o painel): `d = max(dW, dH)·1,06`, com `dW = L/tan(hfov/2)` e
  `dH = H/(tan(vfov/2)·hLivre/h)`.
- O centro óptico é deslocado com `setViewOffset` (`offsetY = h/2 − (topo+base)/2`),
  de modo que a cena fique no meio da área visível, e não atrás do painel.
- A névoa acompanha a distância da câmera (`near = d+2`, `far = d+22`).
- Histórico e dica de atalho são elementos de teste: ficam ocultos e aparecem com `?teste=1`.

## 5. Backend
- `numeros.js`: GET público (primeiro nome apenas); POST com validação e escrita
  atômica (CAS por ETag); `clear` exige `RIFA_ADMIN_TOKEN`.
- `stats.js`: chaves separadas `visits`, `presence`, `lastPayment`; online = sessões com
  heartbeat nos últimos 45 s; consistência forte.

## 6. Propostas pendentes de aprovação
- **P1** Fluxo "reservado → confirmado" pela organização (hoje "Já paguei" marca vendido sem conferência).
- ~~P2 Definir a forma oficial do sorteio~~ → gaiolas, 23/12/2026 (v2.5.0).
- **P5** Regra para número sorteado não comprado (hoje: "sem ganhador nesta extração").
- **P3** Adicionar `poster.jpg` ao repositório (está referenciado mas ausente) e conferir se a arte diz 199.
- **P4** Mover o site estático para `public/` (hoje o código das functions também é servido).
