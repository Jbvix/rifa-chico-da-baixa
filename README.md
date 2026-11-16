# Rifa Solidária - Sr. Francisco Felício (Chico da Baixa)

Página interativa da rifa solidária em prol da manutenção da cama hospitalar do Sr. Francisco Felício (Chico da Baixa).

**Site ao vivo:** [https://rifa-chico-da-baixa.netlify.app](https://rifa-chico-da-baixa.netlify.app)

## ⚠️ Estado da produção (leia primeiro)

O site em produção é publicado pela **linha de comando do Netlify** (não por este GitHub). Desde a v2.6.0 a produção é:

| Parte | Origem |
|---|---|
| `index.html`, `live-client.mjs`, `extras.mjs`, `regras.html`, `sorteio.html`, `sorteio.js`, `vendor/` | **este repositório** |
| funções `stats`, `sorteio`, `sorteio-agendado` + `netlify/lib/` | **este repositório** |
| funções `numeros` (reservas hold/declare), `admin-rifa`, `auth-check`; páginas `painel.html`, `acesso.html`, `auth.*`, `panel.*`, `globos/` | **deploy existente — código-fonte NÃO está neste repositório** |

- `netlify/functions/numeros.js` deste repositório **não está publicado** (modelo de dados antigo). Não publique.
- Dados reais: store `rifa-state-v2` / chave `state-v2` (tickets com `payment`: declared | verified | not_declared).
- A CSP do site exige scripts em arquivos próprios e sem CDNs (`script-src 'self'`).

## Visão Geral

Sistema completo de rifa online com:
- Cartela interativa de **199 números (001 a 199)**
- Cadastro de comprador (nome + telefone)
- Pix Copia e Cola com valor de R$ 20,00 já preenchido
- Contagem regressiva para confirmação de pagamento
- Atualização automática da cartela em tempo real
- Notificação sonora quando alguém confirma pagamento
- Contadores de visitas e usuários online (presença real por heartbeat, TTL 45 s)
- Persistência de dados via Netlify Blobs
- Página de regras do sorteio (regra da Loteria Federal **oculta** desde a v2.0.0)
- Gaiola virtual 3D com sorteio criptográfico (página interna)

## Links

| Página | URL |
|--------|-----|
| Principal | https://rifa-chico-da-baixa.netlify.app |
| Regras | https://rifa-chico-da-baixa.netlify.app/regras.html |
| Gaiola (teste) | https://rifa-chico-da-baixa.netlify.app/sorteio.html |

## Funcionalidades Principais

- **Cartela**: Grid responsivo com números de 001 a 199. Números vendidos aparecem com o **primeiro nome** do comprador (telefone nunca é público).
- **Escolha de número**: Clique → modal com dados do comprador + Pix Copia e Cola.
- **Pix**: Código Copia e Cola completo com valor R$ 20,00. Chave creditada diretamente na conta da Sra. Maria Lúcia (Nubank).
- **Confirmação**: Botão "Já paguei" marca o número como vendido e dispara notificação sonora para todos online.
- **Atualização automática**: Polling periódico atualiza a cartela sem reload.
- **Estatísticas**: Contador de visitas e usuários online.

## Estrutura do Projeto

```
├── index.html              # Página principal da rifa
├── regras.html             # Regras detalhadas do sorteio
├── sorteio.html            # Gaiola virtual 3D (teste interno)
├── manutencao.html         # Página de manutenção (reserva)
├── poster.jpg              # Pôster da rifa (Open Graph) — NÃO está no repositório
├── package.json            # Dependência @netlify/blobs ^11
├── netlify.toml            # Configuração Netlify
├── docs/
│   ├── GDD.md              # Game/Design Document
│   └── MANUAL_DO_USUARIO.md
└── netlify/
    ├── lib/rifa-config.js  # Constantes, validações e escrita atômica (CAS)
    ├── lib/sorteio-core.js # Agenda, geração, liberação, apuração e e-mail
    └── functions/
        ├── numeros.js      # API de números comprados (Netlify Blobs)
        ├── stats.js        # API de visitas, online e último pagamento
        ├── sorteio.js      # API pública do sorteio oficial
        └── sorteio-agendado.js # Função agendada 23/12 10:00–10:10 (e-mail)
```

## Tecnologias

- **Frontend**: HTML + CSS + JavaScript puro (sem frameworks)
- **Backend**: Netlify Functions + Netlify Blobs (persistência)
- **3D**: Three.js r128 + física própria (gaiola de simulação)
- **Hospedagem**: Netlify (site estático + functions)
- **Pagamento**: Pix Copia e Cola (Nubank)

## Responsável

**Dna Lúcia** (esposa do Sr. Francisco)  
WhatsApp: 88993843874  
Pix: +5588993843874 (Nubank - Maria Lúcia Leitão do Nascimento)

O valor do Pix é creditado **diretamente** na conta da Sra. Maria Lúcia.

## Sorteio oficial (gaiolas)

**23/12/2026 — horário de Brasília**

| Hora | Evento |
|------|--------|
| 09:55:00 | Gaiolas começam a girar · **compras encerradas** |
| 09:59:40 | 1ª gaiola — centena (azul: 0, 1 + A) |
| 09:59:50 | 2ª gaiola — dezena (verde: 0–9 + A) |
| 10:00:00 | 3ª gaiola — unidade (amarela: 0–9 + A) → resultado |

- O número é gerado **uma vez no servidor** (crypto, uniforme em 001–199) às 09:59:30, já com as vendas fechadas.
- Cada gaiola é liberada pelo servidor só no instante da sua animação; a página sincroniza o relógio com o servidor.
- Ganhador: **nome + 4 últimos dígitos do telefone** na tela; e-mail de confirmação para `jannatulipa@hotmail.com`
  (com telefone completo), enviado uma única vez pela função agendada `sorteio-agendado` (10:00–10:10) e, como reserva, pela API.
- "A" = bola vermelha de **auditoria** (até 2 por gaiola no oficial): exibida, devolvida e a gaiola gira de novo.
- A Loteria Federal permanece **oculta**.
- Ensaio: `/sorteio.html?ensaio=1` (roteiro completo começando em 5 s, resultado local, não oficial).
  Teste manual: `/sorteio.html?teste=1`.

### Configuração do e-mail (Netlify → Site configuration → Environment variables)

| Variável | Valor |
|----------|-------|
| `RESEND_API_KEY` **ou** `SENDGRID_API_KEY` | chave do provedor |
| `EMAIL_REMETENTE` | remetente verificado no provedor, ex.: `Rifa <rifa@seudominio.com.br>` |
| `EMAIL_RESULTADO` | opcional (padrão `jannatulipa@hotmail.com`) |
| `RIFA_ADMIN_TOKEN` | senha para testes administrativos |
| `SORTEIO_T3` | opcional, só para ensaio em deploy de teste (ISO 8601) |

Teste antes do dia: `POST /.netlify/functions/sorteio` com `{"action":"testar-email"}` e header `x-admin-token`.

## Administração

- `RIFA_ADMIN_TOKEN` (variável de ambiente no Netlify): habilita `POST {action:"clear"}`
  com o header `x-admin-token`. Sem a variável, a limpeza fica desabilitada.

## Histórico de versões

| Versão | Data | Resumo |
|--------|------|--------|
| 3.0.0 | 2026-11-16 | **Publicado.** Física: 6 esferas fixas de mistura por gaiola; comporta + tubo de vidro com rolamento a=(5/7)g·senθ até copo com lupa; auditoria devolvida por cima e cai pela gravidade |
| 2.9.0 | 2026-11-16 | **Publicado.** Vozes ElevenLabs (Jossian: abertura/agradecimento; Carla: auditoria/centena/dezena/unidade) e trilha gospel instrumental nova na gaiola |
| 2.8.0 | 2026-11-16 | **Publicado.** Compra de vários números por pessoa (Pix separado por número), botão "Comprar outro número", aviso de reserva pendente |
| 2.7.0 | 2026-11-16 | **Publicado em produção.** Gaiola para smartphone (paisagem com painel lateral, aviso de girar) |
| 2.6.0 | 2026-11-16 | **Publicado em produção** sobre o sistema de reservas existente: Comprados, Online/Visitas, Loteria oculta, sorteio oficial |
| 2.5.0 | 2026-11-16 | Sorteio OFICIAL pelas gaiolas em 23/12/2026 10h (servidor, sincronizado), ganhador com tel. final, e-mail automático, vendas encerram 9h55, "Comprados" |
| 2.4.0 | 2026-11-16 | Bola vermelha de AUDITORIA em cada gaiola (devolvida e novo giro); Centena azul |
| 2.3.0 | 2026-11-16 | Aros cruzados a ±45° nas gaiolas (antes o aro central aparecia de perfil) |
| 2.2.0 | 2026-11-16 | Gaiola centralizada na área livre (desktop/celular), faixa corrigida, elementos de teste ocultos (`?teste=1`) |
| 2.1.0 | 2026-11-16 | Entorno da gaiola: suporte em A, manivela, mesa, faixa, placas, holofote de foco, pódio |
| 2.0.0 | 2026-11-16 | 199 números; contadores online/visitas corrigidos; Loteria Federal oculta; segurança/LGPD; nova gaiola |
| 1.0.0 | 2026-11-16 | Versão inicial |

## Deploy

O site está hospedado no Netlify. Para atualizar:

1. Faça alterações nos arquivos.
2. Faça push para o repositório GitHub.
3. O Netlify faz o deploy automático (se conectado).

## Desenvolvimento

Autor: **Jossian Brito**.

---

**Rifa Solidária** • Ubajara, Ceará • Em prol do conforto do Sr. Francisco Felício
