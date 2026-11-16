# Rifa Solidária - Sr. Francisco Felício (Chico da Baixa)

Página interativa da rifa solidária em prol da manutenção da cama hospitalar do Sr. Francisco Felício (Chico da Baixa).

**Site ao vivo:** [https://rifa-chico-da-baixa.netlify.app](https://rifa-chico-da-baixa.netlify.app)

## Visão Geral

Sistema completo de rifa online com:
- Cartela interativa de 200 números (001 a 199)
- Cadastro de comprador (nome + telefone)
- Pix Copia e Cola com valor de R$ 20,00 já preenchido
- Contagem regressiva para confirmação de pagamento
- Atualização automática da cartela em tempo real
- Notificação sonora quando alguém confirma pagamento
- Contadores de visitas e usuários online
- Persistência de dados via Netlify Blobs
- Página de regras do sorteio (Loteria Federal)
- Gaiola virtual 3D para simulação (página interna)

## Links

| Página | URL |
|--------|-----|
| Principal | https://rifa-chico-da-baixa.netlify.app |
| Regras | https://rifa-chico-da-baixa.netlify.app/regras.html |
| Gaiola (teste) | https://rifa-chico-da-baixa.netlify.app/sorteio.html |

## Funcionalidades Principais

- **Cartela**: Grid responsivo com números de 001 a 199. Números vendidos aparecem marcados com o nome do comprador.
- **Escolha de número**: Clique → modal com dados do comprador + Pix Copia e Cola.
- **Pix**: Código Copia e Cola completo com valor R$ 20,00. Chave creditada diretamente na conta da Sra. Maria Lúcia (Nubank).
- **Confirmação**: Botão "Já paguei" marca o número como vendido e dispara notificação sonora para todos online.
- **Atualização automática**: Polling periódico atualiza a cartela sem reload.
- **Estatísticas**: Contador de visitas e usuários online.
- **Regras transparentes**: Sorteio baseado nos 3 últimos dígitos dos prêmios da Loteria Federal (000–200).

## Estrutura do Projeto

```
├── index.html              # Página principal da rifa
├── regras.html             # Regras detalhadas do sorteio
├── sorteio.html            # Gaiola virtual 3D (teste interno)
├── poster.jpg              # Pôster da rifa (Open Graph)
├── netlify.toml            # Configuração Netlify
└── netlify/
    └── functions/
        ├── numeros.js      # API de números vendidos (Netlify Blobs)
        └── stats.js        # API de estatísticas e notificações
```

## Tecnologias

- **Frontend**: HTML + CSS + JavaScript puro (sem frameworks)
- **Backend**: Netlify Functions + Netlify Blobs (persistência)
- **3D**: Three.js + Cannon.js (gaiola de simulação)
- **Hospedagem**: Netlify (site estático + functions)
- **Pagamento**: Pix Copia e Cola (Nubank)

## Responsável

**Dna Lúcia** (esposa do Sr. Francisco)  
WhatsApp: 88993843874  
Pix: +5588993843874 (Nubank - Maria Lúcia Leitão do Nascimento)

O valor do Pix é creditado **diretamente** na conta da Sra. Maria Lúcia.

## Sorteio

Por enquanto o sorteio oficial utiliza o resultado da **Loteria Federal**:

- São considerados os 3 últimos dígitos (centena) dos prêmios (1º ao 5º).
- Válidos apenas números entre 000 e 200.
- Se a centena for > 200, pula para o próximo prêmio.
- Se nenhum número válido for encontrado ou o número não tiver sido vendido, o sorteio é adiado para a próxima extração.

A gaiola virtual (`sorteio.html`) está disponível para testes e possível uso futuro. Não é o método oficial no momento.

## Deploy

O site está hospedado no Netlify. Para atualizar:

1. Faça alterações nos arquivos.
2. Faça push para o repositório GitHub.
3. O Netlify faz o deploy automático (se conectado).

## Desenvolvimento

Projeto desenvolvido com apoio do Grok (xAI).

---

**Rifa Solidária** • Ubajara, Ceará • Em prol do conforto do Sr. Francisco Felício
