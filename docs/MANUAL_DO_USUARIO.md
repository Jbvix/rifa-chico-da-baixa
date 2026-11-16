# Manual do Usuário — Rifa Solidária Chico da Baixa

- **Autor:** Jossian Brito · **Versão:** 2.2.0 · **Data/Hora:** 2026-11-16 11:15 (BRT)

## Para quem vai comprar
1. Abra o site e role até a cartela (números **001 a 199**).
2. Toque em um número verde (cinza = já vendido, mostra o primeiro nome do comprador).
3. Preencha **nome completo** e **WhatsApp com DDD** → **Confirmar e gerar Pix**.
4. Copie o código Pix (R$ 20,00 já preenchido) e pague no app do banco.
5. Toque em **Já paguei** e envie o comprovante no WhatsApp da Dna Lúcia.

Os contadores no topo mostram em tempo real: disponíveis, vendidos, pessoas online
(quem está com a página aberta nos últimos ~45 s) e visitas (1 por sessão).

## Gaiola de sorteio (`/sorteio.html`)
- **Sortear** (ou Espaço/Enter): as três gaiolas giram; a gaiola em foco fica iluminada,
  freia e libera a bola da centena, depois dezena e unidade.
- O placar mostra o número e se ele foi vendido (com o primeiro nome) ou não.
- Ícones no topo: 🔊 som · ⛶ tela cheia · ↩ voltar.
- **Modo teste** (organização): abra `/sorteio.html?teste=1` para ver o histórico 🕘 da sessão e a dica de atalho (Espaço/Enter).

## Para a organização
- Para liberar todos os números (uso excepcional): configure `RIFA_ADMIN_TOKEN` no Netlify e
  envie `POST /.netlify/functions/numeros` com `{"action":"clear"}` e o header `x-admin-token`.
- Números antigos fora da faixa (ex.: "200") aparecem na cartela com borda tracejada para decisão manual.
- A regra da Loteria Federal está oculta; para reativar, remova o atributo `hidden` dos blocos
  marcados com `data-loteria` em `index.html` e `regras.html`.
