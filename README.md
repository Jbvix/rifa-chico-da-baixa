# Rifa Solidária - Sr. Francisco Felício (Chico da Baixa)

Página interativa da rifa solidária em prol da manutenção da cama hospitalar do Sr. Francisco Felício.

## Links

- **Página principal:** https://rifa-chico-da-baixa.netlify.app
- **Regras do sorteio:** https://rifa-chico-da-baixa.netlify.app/regras.html
- **Gaiola virtual (teste):** https://rifa-chico-da-baixa.netlify.app/sorteio.html

## Funcionalidades

- Cartela com 200 números (001 a 199)
- Escolha de número com nome e telefone
- Pix Copia e Cola (R$ 20) com valor preenchido
- Contagem regressiva de pagamento
- Atualização automática da cartela
- Notificação sonora quando alguém paga
- Contadores de online e visitas
- Persistência via Netlify Blobs
- Página de regras da Loteria Federal
- Gaiola virtual 3D para simulação (Three.js + Cannon.js)

## Estrutura

- `index.html` — Página principal da rifa
- `regras.html` — Regras do sorteio
- `sorteio.html` — Gaiola virtual (teste interno)
- `poster.jpg` — Pôster da rifa
- `netlify/functions/numeros.js` — API de números vendidos
- `netlify/functions/stats.js` — Estatísticas e notificações
- `netlify.toml` — Configuração do Netlify

## Responsável

Dna Lúcia (esposa)  
WhatsApp: 88993843874  
Pix: +5588993843874 (Nubank - Maria Lúcia Leitão do Nascimento)

## Sorteio

Por enquanto utiliza o resultado da **Loteria Federal** (últimos 3 dígitos do 1º ao 5º prêmio, números de 000 a 200).

A gaiola virtual está em desenvolvimento para possível uso futuro.

---

Projeto desenvolvido com apoio do Grok.