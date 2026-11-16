# Manual do Usuário — Rifa Solidária Chico da Baixa

- **Autor:** Jossian Brito · **Versão:** 3.7.0 · **Data/Hora:** 2026-11-16 13:00 (BRT)

## Para quem vai comprar
1. Abra o site e role até a cartela (números **001 a 199**).
2. Toque em um número verde (cinza = já comprado, mostra o primeiro nome do comprador).
3. Preencha **nome completo** e **WhatsApp com DDD** → **Confirmar e gerar Pix**.
4. Copie o código Pix (R$ 20,00 já preenchido) e pague no app do banco.
5. Toque em **Já paguei** e envie o comprovante no WhatsApp da Dna Lúcia.
6. **Quer mais números?** Toque em **➕ Comprar outro número**: seu nome e WhatsApp já ficam
   preenchidos. Cada número é um **Pix separado de R$ 20,00** — faça um Pix e toque em
   "Já paguei" para cada número. A lista "Seus números nesta visita" mostra os já informados.
   Se trocar de número antes de tocar em "Já paguei", o site avisa para não perder o anterior.

Os contadores no topo mostram em tempo real: disponíveis, comprados, pessoas online
(quem está com a página aberta nos últimos ~45 s) e visitas (1 por sessão).

## Sorteio oficial — 23/12/2026 (horário de Brasília)
- **09:50** as gaiolas começam a girar e **as compras são encerradas**.
- **09:59:40** centena · **09:59:50** dezena · **10:00:00** unidade = resultado.
- Assista em `/sorteio.html`: a página mostra contagem regressiva e se sincroniza sozinha
  com o relógio do servidor; todos veem o mesmo resultado ao mesmo tempo.
- Se o número tiver sido comprado: aparecem o **nome do ganhador** e o **final do telefone** (4 dígitos).
- A organização recebe o resultado por e-mail automaticamente.

## Gaiola de sorteio (`/sorteio.html`)
- **Música:** toque em "🔊 Toque para ativar voz e música" — a trilha gospel toca até o sorteio.
- **Demonstração:** toque em "▶️ Ver demonstração das gaiolas" para ver o giro, a mistura, a bola de
  auditoria e a passagem pelo tubo. A centena cai aos **30 s**, a dezena aos **40 s** e a unidade aos **50 s**. O número da demonstração **não vale**. Disponível até 2 minutos
  antes do sorteio oficial.
- No dia oficial tudo é automático (não há botão). Em `?teste=1`, **Sortear (teste)**: as três gaiolas giram; a gaiola em foco fica iluminada,
  freia e libera a bola da centena, depois dezena e unidade.
- O placar mostra o número e o ganhador (ou "número não comprado").
- **Bola vermelha "A" (auditoria):** existe uma em cada gaiola. Se ela sair, aparece em
  vermelho no placar, volta para a gaiola e a gaiola gira de novo. Ela prova que a gaiola
  está misturando e não muda a chance de nenhum número. A quantidade de auditorias aparece
  abaixo do resultado.
- Cores: Centena azul (0 e 1), Dezena verde (0–9), Unidade amarela (0–9).
- **Som:** toque em "🔊 Toque para ativar voz e música" (o celular só toca som após um toque). Trilha gospel durante o giro; vozes anunciam abertura, auditoria, centena, dezena, unidade e o agradecimento.
- Ícones no topo: 🔊 som · ⛶ tela cheia · ↩ voltar.
- **Modo teste** (organização): abra `/sorteio.html?teste=1` para ver o histórico 🕘 da sessão e a dica de atalho (Espaço/Enter).

## Para a organização
- **Lembrete na agenda:** botão "📅 Me lembrar do sorteio" (página principal, regras e gaiola).
- **Painel de vendas ao vivo:** abra o link pessoal recebido, toque em "🔔 Ativar alertas" e deixe a
  página aberta. Somente leitura; "pagamento informado" precisa ser conferido no extrato.
- **Kit WhatsApp:** arquivo entregue em separado (contém telefones; não publicar).
- **Ensaio geral**: abra `/sorteio.html?ensaio=1` — o roteiro oficial completo começa em 5 s (resultado não oficial).
- **E-mail**: configure as variáveis descritas no README e envie um teste antes do dia
  (`POST /.netlify/functions/sorteio` com `{"action":"testar-email"}` e o header `x-admin-token`).
- Para liberar todos os números (uso excepcional): configure `RIFA_ADMIN_TOKEN` no Netlify e
  envie `POST /.netlify/functions/numeros` com `{"action":"clear"}` e o header `x-admin-token`.
- Números antigos fora da faixa (ex.: "200") aparecem na cartela com borda tracejada para decisão manual.
- A regra da Loteria Federal está oculta; para reativar, remova o atributo `hidden` dos blocos
  marcados com `data-loteria` em `index.html` e `regras.html`.
