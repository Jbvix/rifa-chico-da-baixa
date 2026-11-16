# Rifa Solidária - Sr. Francisco Felício (Chico da Baixa)

Página interativa da rifa solidária em prol da manutenção da cama hospitalar do Sr. Francisco Felício (Chico da Baixa).

**Site ao vivo:** [https://rifa-chico-da-baixa.netlify.app](https://rifa-chico-da-baixa.netlify.app)

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
    └── functions/
        ├── numeros.js      # API de números vendidos (Netlify Blobs)
        └── stats.js        # API de visitas, online e último pagamento
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

## Sorteio

A regra pela **Loteria Federal está oculta** desde a v2.0.0 (conteúdo preservado com
atributo `hidden` em `index.html` e `regras.html`). A data e a forma do sorteio serão
divulgadas pela responsável.

A gaiola virtual (`sorteio.html`) sorteia 001–199 com `crypto.getRandomValues`
(distribuição uniforme exata) e mostra se o número foi vendido.

## Administração

- `RIFA_ADMIN_TOKEN` (variável de ambiente no Netlify): habilita `POST {action:"clear"}`
  com o header `x-admin-token`. Sem a variável, a limpeza fica desabilitada.

## Histórico de versões

| Versão | Data | Resumo |
|--------|------|--------|
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
