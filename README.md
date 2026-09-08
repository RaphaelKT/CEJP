# Missão Evangélica do Brasil — Plataforma Digital

Site institucional e sistema de gestão da **Missão Evangélica do Brasil**
(Estrada da Água Branca, 3570 — Padre Miguel, Rio de Janeiro/RJ).

Não é só um site: é o sistema que a igreja usa por dentro — presença,
membresia, inscrições pagas, mural de orações e publicação de fotos — com um
site público bonito na frente.

---

## Sumário

- [O que o sistema faz](#o-que-o-sistema-faz)
- [Tecnologias](#tecnologias)
- [Como rodar](#como-rodar)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Os cinco subsistemas](#os-cinco-subsistemas)
- [Rotinas agendadas](#rotinas-agendadas)
- [Segurança e LGPD](#segurança-e-lgpd)
- [Deploy](#deploy)

---

## O que o sistema faz

### Site público

| Página | O que tem |
|---|---|
| **Início** | Carrossel de cultos com dias e horários, contadores ao vivo, versículo do dia, grade semanal, eventos, prévia do mural e mapa da sede |
| **Sobre nós** | História desde 1987, linha do tempo, valores, declaração de fé e liderança |
| **Eventos** | Retiro de Carnaval, JUMEB, Missões, Congressos, Acampamentos — com busca e filtros |
| **Evento** | Página própria com descrição, lotes, galeria das edições anteriores e botão de inscrição |
| **Inscrição** | Checkout em 4 etapas com PIX, cartão parcelado e boleto |
| **Mural de orações** | Pedidos anônimos, botão "Estou orando", respostas e tempo real |
| **Cultos** | Programação completa + exportação para o calendário (.ics) |
| **Contato** | Formulário, canais diretos e horário da secretaria |
| **Minha conta** | Inscrições, presenças e progresso rumo à membresia |

### Área interna (`/painel`)

Acesso por papel (RBAC): Mídia, Secretaria, Tesouraria, Liderança, Pastoral e
Administração.

- **Enviar fotos** — relatório guiado + conferência automática de local e data
- **Membresia** — fila de confirmação pastoral e frequentadores a caminho
- **Moderação** — mural e lotes de fotos em dúvida
- **Financeiro** — recebido, taxas, líquido, razão contábil e conciliação

---

## Tecnologias

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 15** (App Router, RSC, Server Actions) | Renderização no servidor por padrão: a home carrega pronta, o SEO funciona e o JavaScript enviado ao celular é mínimo |
| Linguagem | **TypeScript** estrito | O modelo de dados é grande; tipos evitam a classe de erro mais cara em produção |
| Banco | **PostgreSQL + Prisma** | Transações reais (essencial para reserva de vaga e pagamento) e migrações versionadas |
| Estilo | **Tailwind CSS** com tokens próprios | A paleta branco/dourado/vermelho vive em um único arquivo |
| Animação | **Framer Motion** | Respeita `prefers-reduced-motion` |
| Mapa | **Leaflet + OpenStreetMap** | Sem chave de API, sem custo por carregamento, sem chave exposta no bundle |
| Pagamentos | **Mercado Pago / Stripe / Sandbox** | Interface única; trocar de provedor não toca no resto do sistema |
| Tempo real | **SSE** | Tráfego é só servidor → navegador; atravessa proxy sem configuração e reconecta sozinho |
| Imagens | **sharp** + **exifr** | Decodificação real para hash perceptual e leitura de EXIF/GPS |

---

## Como rodar

Requisitos: Node.js 20+ e PostgreSQL 14+ (ou Docker).

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env
# gere os segredos:
#   openssl rand -base64 48   → AUTH_SECRET
#   openssl rand -base64 32   → HASH_PEPPER
#   openssl rand -base64 32   → CRON_SECRET

# 3. Banco de dados
docker compose up -d          # ou use um Postgres já existente
npm run db:migrate
npm run db:seed

# 4. Materializa os cultos da semana
npm run jobs:daily

# 5. Desenvolvimento
npm run dev                   # http://localhost:3000
```

### Contas criadas pelo seed

| E-mail | Papel | Senha |
|---|---|---|
| `pastor@meb.org.br` | Pastoral + Administração | `Meb@2026` |
| `secretaria@meb.org.br` | Secretaria | `Meb@2026` |
| `midia@meb.org.br` | Equipe de mídia | `Meb@2026` |
| `tesouraria@meb.org.br` | Tesouraria | `Meb@2026` |
| `juventude@meb.org.br` | Liderança | `Meb@2026` |

> Troque todas as senhas antes de colocar no ar.

### Scripts

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run start        # servidor de produção
npm run typecheck    # verificação de tipos
npm run db:migrate   # aplica migrações (dev)
npm run db:deploy    # aplica migrações (produção)
npm run db:seed      # popula a base
npm run db:studio    # inspetor visual do banco
npm run jobs:daily   # executa as rotinas agendadas localmente
```

---

## Estrutura do projeto

```
prisma/
  schema.prisma          modelo de dados (9 domínios, 40+ tabelas)
  seed.ts                base institucional + congregação de demonstração
src/
  app/
    (site)/              páginas públicas
    (auth)/              entrar e cadastro
    painel/              área interna com RBAC
    api/                 rotas de API, webhooks e cron
  components/            componentes de UI por domínio
  lib/
    auth/                sessão, criptografia, RBAC
    payments/            gateways, precificação, conciliação
    membership/          presença e motor de membresia
    media/               validação de fotos e armazenamento
    content/             versículo do dia
    realtime/            barramento de eventos (SSE)
    jobs/                rotinas agendadas
scripts/run-jobs.ts      executor local das rotinas
docs/ARQUITETURA.md      decisões de projeto em detalhe
```

---

## Os cinco subsistemas

### 1. Presença e membresia automática

Resolve a pergunta central: *como saber, com confiança, que alguém esteve
na igreja cinco vezes no mês?*

**Captação.** Um totem (TV ou tablet na entrada) exibe um QR que muda **a cada
60 segundos**. O código é `culto.janela.assinatura`, assinado com HMAC usando
o segredo do servidor. Um print antigo compartilhado no grupo do WhatsApp
expira sozinho e não funciona.

**Score antifraude.** Cada check-in soma sinais independentes:

| Sinal | Peso |
|---|---:|
| Token rotativo válido | 35 |
| Dentro da geocerca do templo (400 m) | 30 |
| Dentro da janela do culto (±45 min) | 20 |
| Precisão de GPS aceitável | 10 |
| Dispositivo já conhecido daquela pessoa | 5 |

≥ 70 confirma na hora · 40–69 vai para a recepção conferir · < 40 é marcado
como suspeito e **não conta** para a membresia.

**Promoção.** Ao completar **5 presenças confirmadas em 30 dias** (janela
deslizante, não mês-calendário — quem vem dia 28, 29, 30, 1 e 2 é reconhecido),
o sistema move a pessoa para `EM_AVALIACAO` e notifica a secretaria. Depois da
conversa e da confirmação humana, ela vira `MEMBRO`, recebe matrícula
(`MEB-2026-00042`) e **o contador da home sobe sozinho**, com animação.

Os parâmetros (5 presenças, 30 dias, exigir confirmação) ficam na tabela
`membership_rules` — a igreja muda a régua sem precisar de deploy.

**Caminhos alternativos de captação**, todos no mesmo modelo: carteirinha com
QR lida na recepção, NFC, catraca, registro manual pela secretaria e importação
de planilha para migrar o histórico de papel.

### 2. Pagamentos

- **Interface única** (`PaymentGateway`) com três implementações: Mercado Pago
  (PIX, cartão, boleto), Stripe (missões internacionais) e Sandbox — que
  reproduz a máquina de estados inteira sem credenciais, para demonstração e QA.
- **Preço calculado sempre no servidor.** O navegador manda quantidade e lote;
  nunca valores. Adulterar o cliente não muda um centavo.
- **Tudo em centavos inteiros.** Nenhum `float` toca dinheiro. As parcelas são
  distribuídas de modo que a soma bata exatamente com o total.
- **Idempotência em dois níveis:** chave única por sessão de compra (duplo
  clique não gera dois pedidos) e por evento de webhook (reentrega não
  reprocessa).
- **Reserva de vaga com trava otimista:** duas pessoas comprando a última vaga
  ao mesmo tempo — só uma leva; a outra recebe mensagem clara e o dinheiro nem
  chega a ser cobrado.
- **Webhook com HMAC verificado antes de qualquer leitura de negócio**, com
  janela antirreplay de 5 minutos.
- **Conciliação horária:** webhooks se perdem. Uma rotina consulta o provedor
  sobre todo pagamento pendente, reaplica o estado real, expira PIX e boletos
  vencidos e **devolve as vagas** ao estoque.
- **Razão contábil** alimentado a cada captura (receita, taxa do provedor,
  estorno), o que dá à tesouraria o líquido real de caixa.
- **PCI:** os dados do cartão são tokenizados no navegador. O número completo e
  o CVV nunca chegam ao servidor.

### 3. Mídia com conferência geoespacial

O fluxo que a equipe de mídia pediu, do jeito que evita foto errada no site.

1. A pessoa preenche um **relatório com menus suspensos**: contexto (evento,
   culto, missão, ação social), evento e edição, ano, data das fotos, local,
   fotógrafo, legenda, marcadores, presença de menores e confirmação de
   autorização de imagem.
2. Envia o lote (até 60 fotos).
3. Cada foto é conferida por cinco sinais:

| Sinal | Peso | O que verifica |
|---|---:|---|
| **Localização** | 40 | Coordenada do EXIF × geocerca do local declarado (Haversine). Se a distância for grande, consulta a geocodificação reversa e compara **CEP e bairro** |
| **Data** | 25 | `DateTimeOriginal` × data informada e × janela do evento |
| **Originalidade** | 15 | SHA-256 (arquivo idêntico) + **hash perceptual 8×8** (mesma imagem recomprimida ou redimensionada) |
| **Resolução** | 10 | Dimensões reais lidas do decodificador |
| **Origem** | 10 | Marca e modelo da câmera (ausência sugere captura de tela) |

4. **Decisão:** ≥ 75 publica direto na galeria · 45–74 vai para conferência
   humana · < 45 ou falha crítica é devolvida.
5. **Devolução acionável.** A pessoa não recebe "erro". Recebe:

   > *"Nenhuma foto foi publicada. A conferência automática indicou divergência
   > em: Local da captação. Revise o campo 'Local da captação' e reenvie."*

   E, quando a foto chegou sem metadados:

   > *"Os arquivos chegaram sem localização e data. Isso acontece quando as
   > fotos são enviadas por WhatsApp. Envie os originais da câmera."*

**Duas decisões de produto deliberadas:**

- Foto **sem** geotag não é reprovada — vai para conferência humana. Metade das
  fotos de igreja passa por WhatsApp; reprovar seria inviabilizar a equipe.
- Semelhança perceptual é **indício, não prova**. Duas fotos da mesma cena
  tiradas em rajada são legitimamente parecidas, então uma quase-duplicata vai
  para revisão. Só arquivo byte a byte idêntico reprova direto.
- O hash perceptual é descartado em imagens de baixo contraste (uma parede, um
  slide branco), onde ele colidiria e acusaria fotos diferentes de duplicadas.

### 4. Mural de orações

Moderação em três camadas: heurística instantânea → fila humana → classificador
externo opcional (plugável).

A régua é calibrada para **não** bloquear desabafo pesado (luto, depressão,
vício) — apenas ataque, spam e exposição de terceiros:

- Telefones, e-mails e CPFs digitados no texto são **removidos automaticamente**
  e substituídos por `[dado removido]`, protegendo quem escreveu.
- Um único palavrão dentro de um desabafo vai para revisão humana. Três ou mais
  termos ofensivos caracterizam agressão e são barrados.
- **Sinal de crise** (menção a suicídio ou automutilação) não bloqueia: publica,
  escala para a pastoral com prioridade e devolve na hora a tela de acolhimento
  com o **CVV 188**.
- Pedidos anônimos **não são vinculados à conta** no banco. Nem a pastoral
  consegue identificar o autor.
- O "Estou orando" é único por pessoa, com atualização otimista e reversão em
  caso de falha.

### 5. Versículo diário

A seleção é **determinística**: uma função da data local em `America/São_Paulo`.
Servidor, cache de borda e navegador chegam sempre ao mesmo versículo, e a
virada acontece exatamente às 00:00 **sem depender de um job ter rodado**. O
`Cache-Control` expira no instante da virada, e a página agenda um refetch —
quem deixou a aba aberta a noite toda vê o versículo novo sem recarregar.

A rotina noturna apenas materializa o registro, permitindo que a pastoral
escreva uma reflexão para o dia.

---

## Rotinas agendadas

Protegidas por segredo compartilhado (`x-cron-secret`). Funcionam com Vercel
Cron, GitHub Actions ou `crontab` — o `vercel.json` já vem configurado.

| Rotina | Frequência | O que faz |
|---|---|---|
| `/api/cron/versiculo` | 00:00 | Materializa o versículo do dia |
| `/api/cron/membresia` | 00:05 | Reavalia frequência e inativa membros ausentes |
| `/api/cron/cultos` | Segunda 00:15 | Materializa as ocorrências das próximas 4 semanas |
| `/api/cron/reconciliacao` | de hora em hora | Concilia pagamentos e devolve vagas expiradas |
| `/api/cron/contadores` | a cada 15 min | Recalcula os contadores públicos |

---

## Segurança e LGPD

- Sessão em **cookies httpOnly** — access token curto (20 min, JWT assinado com
  `jose`) + refresh rotativo persistido, revogável por dispositivo.
- Senhas com **bcrypt (12 rounds) + pepper** fora do banco.
- **CPF nunca em texto legível**: hash com pepper + os quatro últimos dígitos
  para conferência visual.
- **IP anonimizado** antes de persistir (hash com sal), preservando o valor
  antifraude sem guardar o dado pessoal.
- **RBAC** com matriz de permissões explícita (`lib/auth/rbac.ts`).
- **Limitação de taxa** por rota e por IP, com mensagens em português.
- **Trilha de auditoria** (`audit_logs`) de toda operação sensível.
- Proteção contra **enumeração de contas** (mensagem genérica no login) e
  bloqueio temporário após 6 tentativas.
- Cabeçalhos de segurança (HSTS, `X-Content-Type-Options`, `Permissions-Policy`).
- **Registro de consentimento** versionado por finalidade.
- A aplicação **se recusa a subir em produção** com segredos padrão.

---

## Deploy

```bash
npm run db:deploy     # aplica migrações
npm run build
npm run start
```

Variáveis obrigatórias em produção: `DATABASE_URL`, `APP_URL`, `AUTH_SECRET`,
`HASH_PEPPER`, `CRON_SECRET`. Para cobrar de verdade, defina
`PAYMENT_PROVIDER=MERCADO_PAGO` com `MERCADO_PAGO_ACCESS_TOKEN` e
`MERCADO_PAGO_WEBHOOK_SECRET`. Sem eles o sistema opera em modo Sandbox, que
reproduz todo o fluxo sem mover dinheiro.

Para armazenamento de fotos em produção, troque o adaptador local por S3 ou R2
implementando a interface `StorageAdapter` (`src/lib/media/storage.ts`) —
nenhum outro arquivo muda.

---

Documentação detalhada das decisões de projeto: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).
