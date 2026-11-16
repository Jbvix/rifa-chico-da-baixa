# GDD — Rifa Solidária Chico da Baixa (Game/Design Document)

- **Autor:** Jossian Brito
- **Versão do documento:** 2.4.0
- **Data/Hora:** 2026-11-16 12:10 (BRT, UTC-3)

## 1. Visão
Rifa beneficente online, transparente e sem atrito no celular: o comprador escolhe um
número, paga via Pix e vê a cartela atualizar em tempo real para todos.

## 2. Regras de negócio
| Item | Valor |
|------|-------|
| Números | **199** (001 a 199) — corrigido na v2.0.0 (antes: 200 e "000 a 200") |
| Preço | R$ 20,00 por número (Pix Copia e Cola) |
| Sorteio | Após a venda do último número; forma a ser divulgada pela responsável |
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
- **P2** Definir a forma oficial do sorteio (gaiola, Loteria Federal ou outra).
- **P3** Adicionar `poster.jpg` ao repositório (está referenciado mas ausente) e conferir se a arte diz 199.
- **P4** Mover o site estático para `public/` (hoje o código das functions também é servido).
