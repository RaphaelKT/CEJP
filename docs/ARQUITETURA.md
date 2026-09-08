# Decisões de arquitetura

Este documento registra **por que** o sistema é como é. Cada decisão traz a
alternativa descartada e o motivo — para que quem mantiver o projeto daqui a
dois anos não desfaça sem querer algo que existia por uma razão.

---

## 1. Por que Next.js com renderização no servidor

A maioria das visitas ao site de uma igreja vem de celular, muitas vezes em
rede móvel ruim. Uma SPA tradicional baixaria o JavaScript, executaria, pediria
os dados e só então mostraria os horários dos cultos.

Com React Server Components a home chega **pronta**: horário do próximo culto,
versículo do dia e endereço já vêm no HTML. O JavaScript enviado ao navegador
cobre apenas o que precisa de interação (carrossel, mural, checkout).

O SEO é consequência: uma igreja precisa aparecer em "igreja evangélica Padre
Miguel". Conteúdo renderizado no servidor + dados estruturados `schema.org/Church`
resolvem isso sem truque.

---

## 2. Por que PostgreSQL, e não um banco de documentos

O domínio é intensamente relacional: pessoa → presença → culto → membresia;
pedido → item → lote → edição → evento. E, mais decisivo, há **duas operações
que exigem transação real**:

1. **Reserva de vaga.** Duas pessoas comprando a última vaga do retiro ao mesmo
   tempo. A reserva usa `UPDATE ... WHERE quantitySold <= total - quantidade`,
   que o banco resolve atomicamente. Só uma leva a vaga; a outra recebe uma
   mensagem clara e não é cobrada.

2. **Captura de pagamento.** Atualizar pedido, confirmar inscrições e lançar no
   razão contábil precisa acontecer inteiro ou não acontecer.

Em um banco de documentos isso viraria lógica de compensação na aplicação —
mais código, mais casos de borda, e dinheiro envolvido.

---

## 3. Autenticação própria, e não NextAuth

NextAuth v5 ainda está em beta, e o modelo de sessão dele não acomoda bem dois
requisitos deste projeto: **papéis com matriz de permissões** e **revogação por
dispositivo**.

A implementação usa apenas primitivas maduras: `jose` para JWT, `bcryptjs` para
senha, cookies httpOnly. O access token é curto (20 min) e o refresh vive no
banco — o que permite "sair de todos os dispositivos", listar sessões ativas e
invalidar uma sessão específica sem esperar o token expirar.

Custo: mais código nosso. Ganho: nenhuma dependência beta no caminho crítico de
autenticação, e controle total sobre a revogação.

---

## 4. Por que SSE, e não WebSocket

Os contadores da home e o mural precisam se atualizar sozinhos. O tráfego é
**unidirecional** — o servidor avisa, o navegador escuta.

WebSocket exigiria um servidor com estado, configuração de proxy e uma camada
própria de reconexão. SSE é HTTP comum: atravessa qualquer proxy, reconecta
sozinho pelo `EventSource` e cai bem em plataformas serverless.

O barramento (`lib/realtime/bus.ts`) é uma interface de duas funções
(`publish`/`subscribe`). Para escalar para várias instâncias, troca-se o
`EventEmitter` por Redis Pub/Sub mantendo a assinatura — nenhum consumidor muda.

---

## 5. Camada de pagamento com interface única

`PaymentGateway` define seis operações. Existem três implementações:

- **MercadoPagoGateway** — PIX, cartão e boleto, com HMAC do webhook validado.
- **StripeGateway** — cartão internacional, para as campanhas de missões.
- **SandboxGateway** — reproduz a máquina de estados inteira sem credenciais.

O Sandbox não é um "mock de teste": ele é o motivo de o produto poder ser
demonstrado, homologado e desenvolvido sem uma conta de produção. Cartões cujo
token termina em `0000` são recusados por saldo, `0001` cai em análise, o resto
aprova — o que torna os casos difíceis reproduzíveis.

### A máquina de estados é explícita

```
CRIADO → PENDENTE → AUTORIZADO → CAPTURADO → ESTORNADO_PARCIAL → ESTORNADO_TOTAL
                 ↘ RECUSADO   ↘ EXPIRADO                       ↘ CHARGEBACK
```

Transições fora do mapa são **rejeitadas e auditadas**, não aplicadas. Isso
protege contra a situação real em que webhooks chegam fora de ordem: um evento
"pendente" atrasado não pode rebaixar um pagamento já capturado.

### Webhooks são tratados como não confiáveis

Ordem obrigatória: validar HMAC → persistir o evento cru com chave única →
processar. Reentrega não reprocessa. E respondemos `200` sempre que o evento foi
**recebido**, mesmo se o processamento falhar — senão o provedor entra em laço
de reenvio. A falha fica registrada e a conciliação horária assume.

---

## 6. Dinheiro em centavos inteiros

Nenhum `float` toca valor monetário. `0.1 + 0.2 !== 0.3` é uma curiosidade em
qualquer outro contexto e um problema contábil aqui.

O parcelamento distribui o resto da divisão nas primeiras parcelas, garantindo
que a soma bata **exatamente** com o total: R$ 100,00 em 3× vira 33,34 + 33,33
+ 33,33, nunca 33,33 × 3 = 99,99.

---

## 7. Presença: por que o QR precisa girar

Um QR fixo impresso na parede é fotografado uma vez e circula no grupo da
igreja. A presença deixa de significar presença — e, como a membresia depende
dela, o número de membros deixa de significar membros.

O token muda a cada 60 segundos e é assinado com HMAC. Não é possível gerar um
válido fora do servidor, e um print de ontem não funciona. Aceitamos a janela
atual e a anterior, por tolerância de relógio e latência.

O QR sozinho ainda não basta — alguém pode transmitir o código por mensagem em
tempo real. Por isso ele é **um** dos cinco sinais, e o mais pesado depois dele
é a geocerca: para fraudar, seria preciso o código do minuto **e** estar dentro
de 400 metros do templo. A essa altura, é mais fácil ir ao culto.

### Por que janela deslizante, e não mês-calendário

O pedido original era "5 vezes no mês". A implementação usa **30 dias corridos**
porque o corte mensal produz uma injustiça concreta: quem foi dia 28, 29, 30, 1
e 2 esteve na igreja cinco vezes em cinco dias e não seria reconhecido por
nenhum dos dois meses. A janela deslizante reconhece.

### Por que a confirmação humana permanece

O sistema **detecta** o critério; quem **reconhece** a membresia é a igreja.
Membresia é um vínculo pastoral, não um troféu de frequência — e um erro aqui
(promover quem não deveria, ou deixar de promover quem deveria) é constrangedor
de desfazer. A regra é configurável no banco: uma igreja que prefira promoção
automática desliga a exigência sem deploy.

---

## 8. Validação de fotos: o que o sistema garante e o que não garante

**Garante:** que a coordenada gravada no arquivo é compatível com o local
declarado, que a data bate com o evento, e que a imagem não é reenvio de algo
já publicado.

**Não garante:** que a foto é *boa*, que as pessoas nela autorizaram o uso, ou
que ela representa o momento certo do evento. Isso é julgamento humano — e é por
isso que a fila de revisão existe, em vez de o sistema fingir que decide sozinho.

### Por que geocodificação reversa como segundo sinal

A distância bruta não distingue "o fotógrafo estava do outro lado da rua" de
"esta foto é de outra cidade". Quando a coordenada cai longe, consultamos o
Nominatim (OpenStreetMap, sem chave de API) e comparamos **CEP e bairro** com o
local declarado. Se o CEP confere, tratamos como imprecisão de GPS, não fraude.

### Por que o hash perceptual é 8×8 e tem guarda de contraste

O SHA-256 só pega arquivo idêntico. Salvar a foto de novo, mandar por WhatsApp
ou redimensionar muda todos os bytes — mas é a mesma foto.

O *average hash* reduz a imagem a 8×8 tons de cinza e transforma cada pixel em
um bit conforme fique acima ou abaixo da média. Descreve a **aparência**, não os
bytes, e sobrevive a recompressão (verificado: uma cópia em 1200×900 com
qualidade 62 foi detectada).

A guarda de contraste existe porque descobrimos, testando, que imagens de baixa
variância — uma parede, um slide branco, um fundo liso — colapsam para hashes
quase idênticos depois do 8×8. Sem a guarda, o sistema acusaria fotos legítimas
e diferentes de serem duplicatas, e a equipe de mídia perderia a confiança nele.
Abaixo do desvio padrão mínimo, o pHash é descartado e a checagem cai para o
SHA-256, que é exato.

Pelo mesmo motivo, semelhança perceptual gera **alerta**, não reprovação: duas
fotos da mesma cena tiradas em rajada são legitimamente parecidas.

---

## 9. Mural: por que a moderação é calibrada para o lado permissivo

Um mural de orações recebe o pior dia da vida das pessoas. Um filtro agressivo
transformaria "não aguento mais essa dor" em conteúdo bloqueado — exatamente a
mensagem que mais precisa ser lida.

Portanto:

- Um único palavrão em um desabafo vai para revisão humana, não para o lixo.
- Três ou mais termos ofensivos caracterizam agressão e são barrados.
- Menção a suicídio **não é bloqueada**: é publicada, escalada para a pastoral
  com prioridade, e devolve na hora a tela de acolhimento com o CVV 188.
  Silenciar alguém em crise seria o pior resultado possível deste recurso.

O anonimato é real: pedidos anônimos não guardam vínculo com a conta no banco.
Uma "impressão digital" derivada de IP e navegador — hash, nunca o dado — impede
spam e garante um voto por pessoa, sem identificar ninguém.

---

## 10. Versículo determinístico

A alternativa óbvia seria um job noturno gravando o versículo do dia. O problema
é o que acontece quando o job falha: o site mostra o versículo de ontem, e
ninguém percebe até alguém reclamar.

A seleção é uma função pura da data local (`hash(YYYY-MM-DD) % total`). Servidor,
cache de borda e navegador chegam ao mesmo resultado. O job noturno só
materializa o registro, permitindo que a pastoral escreva uma reflexão do dia —
mas se ele nunca rodar, o versículo continua certo.

---

## 11. `safeQuery`: o site não cai porque o banco caiu

Toda leitura das páginas públicas passa por `safeQuery`, que devolve conteúdo
institucional se a consulta falhar.

Isso não é preguiça de tratar erro: é uma decisão de produto. Se o banco cair
num domingo de manhã, o pior resultado possível é o visitante não descobrir o
horário do culto. Com o fallback, ele vê a grade padrão, o endereço e o mapa —
e vem para a igreja. O painel interno, esse sim, falha alto e visível.

---

## 12. Mapa sem chave de API

Google Maps cobra por carregamento e exige uma chave que, no front-end, fica
exposta. Para uma igreja, isso é custo recorrente e risco de conta sequestrada.

Leaflet com tiles do CARTO/OpenStreetMap não tem chave nem custo. Os botões de
rota abrem o app preferido do visitante — Google Maps, Waze, Apple Maps ou Uber
— por deep link, que é como as pessoas realmente navegam.

---

## 13. O que ficou preparado, mas não implementado

Honestidade sobre o escopo:

- **Envio de e-mail** — os tokens de verificação e as notificações são gravados
  no banco; falta plugar um provedor (Resend, SES ou SMTP) no ponto de envio.
- **Notificação por WhatsApp** — o modelo `Notification` já tem o canal; falta a
  integração com a API oficial.
- **Emissão de nota fiscal** — o modelo `Invoice` existe; a integração com a
  prefeitura é específica do município.
- **Classificador de toxicidade externo** — a camada 3 da moderação é um ponto
  de extensão declarado, não uma integração pronta.
- **Redis** — o barramento de eventos e a limitação de taxa são em memória, o
  que atende uma instância. A troca está isolada atrás de duas interfaces.
