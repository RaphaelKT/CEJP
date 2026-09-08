# Como captar, com confiança, que uma pessoa foi 5 vezes à igreja

Guia prático para a secretaria e a liderança. Responde a pergunta central do
projeto: **qual o método mais assertivo de registrar presença e levar esse dado
para dentro do sistema.**

---

## O problema real

Contar presença em igreja é difícil por três motivos:

1. **Ninguém quer burocracia na porta.** Se a fila atrasa o culto, o método
   morre em duas semanas.
2. **A pessoa que mais precisa ser contada é a que menos se cadastra.** O
   visitante novo não vai baixar aplicativo.
3. **O dado precisa ser confiável.** Se a presença puder ser fraudada, o número
   de membros na home vira ficção — e a igreja perde a confiança no sistema.

O método recomendado abaixo resolve os três.

---

## Recomendação: QR rotativo no telão + confirmação na recepção

### Como funciona na prática

**Antes do culto.** Uma TV, tablet ou notebook na entrada abre a página do
totem. Ela exibe um QR grande que **muda sozinho a cada 60 segundos**. Ninguém
precisa operar nada.

**Na chegada.** A pessoa aponta a câmera do celular para o QR. O navegador abre
já na página de presença, ela toca em um botão e pronto — 4 segundos, sem fila,
sem aplicativo para instalar.

**Para quem não tem celular ou não quer usar.** A recepção tem um tablet com a
lista da igreja. Digita as primeiras letras do nome e marca a presença. Leva o
mesmo tempo que anotar em papel, e já entra no sistema.

**Para membros antigos.** Carteirinha impressa com QR próprio, lida pelo tablet
da recepção. Uma passada, como um crachá.

### Por que o QR gira

Um QR fixo impresso na parede é fotografado uma vez e circula no grupo do
WhatsApp. A partir daí, "presença" deixa de significar presença.

O código muda a cada minuto e é assinado criptograficamente. Um print de ontem
não funciona. Para fraudar seria preciso alguém transmitir o código **em tempo
real** — e aí entra a segunda barreira.

### As cinco barreiras

Cada registro recebe uma nota de confiança de 0 a 100:

| O que o sistema verifica | Pontos |
|---|---:|
| O QR escaneado é o do minuto atual | 35 |
| O celular está a menos de 400 m do templo | 30 |
| É horário de culto (±45 min) | 20 |
| O GPS está preciso | 10 |
| É o mesmo celular que a pessoa sempre usa | 5 |

- **70 ou mais** → presença confirmada na hora.
- **40 a 69** → registrada, mas a recepção precisa confirmar.
- **Abaixo de 40** → marcada como suspeita e **não conta** para a membresia.

Na prática: alguém tentando registrar presença de casa consegue o código (se
alguém mandar), mas perde os 30 pontos da localização e provavelmente os 20 do
horário. Fica em 35 — abaixo do corte. **A fraude não passa.**

---

## Comparação com as alternativas

| Método | Confiabilidade | Atrito | Custo | Veredito |
|---|---|---|---|---|
| **QR rotativo + recepção** | Alta | Muito baixo | Zero (usa uma TV que a igreja já tem) | **Recomendado** |
| Lista de papel digitada depois | Baixa (letra ilegível, digitação atrasada, ninguém confere) | Baixo na hora, alto depois | Horas de trabalho da secretaria | Só como emergência |
| QR fixo impresso | Muito baixa (circula no grupo) | Muito baixo | Zero | Não usar |
| Catraca com cartão | Muito alta | Médio (fila) | R$ 8.000–25.000 + manutenção | Só se a igreja já tiver |
| Reconhecimento facial | Alta | Nenhum | Alto, e cria um problema de LGPD sério (dado biométrico é dado sensível) | Não recomendado |
| Aplicativo próprio | Média (só quem instalou) | Alto (instalar, cadastrar, atualizar) | Desenvolvimento + duas lojas | Não compensa |
| Check-in por geolocalização apenas | Baixa (dá para falsificar GPS) | Nenhum | Zero | Só como sinal complementar |

O QR rotativo ganha porque é o único que combina **confiabilidade alta**,
**atrito quase zero** e **custo zero**.

---

## Como os dados entram no sistema

Não há "transferência" — o dado **nasce dentro do sistema**. Esse é o ponto.

```
Pessoa escaneia o QR
        ↓
POST /api/presenca/checkin
   { código do QR, localização, identificação do aparelho }
        ↓
Servidor confere as cinco barreiras e calcula a nota
        ↓
Grava em check_ins  (nota + todos os sinais, para auditoria)
        ↓
Reavalia a frequência dessa pessoa na hora
        ↓
Atingiu 5 presenças em 30 dias?
   → move para "aguardando confirmação"
   → avisa a secretaria
        ↓
Secretaria conversa com a pessoa e confirma
        ↓
Vira MEMBRO, recebe matrícula MEB-2026-00042
        ↓
Contador de membros da home sobe sozinho, com animação
```

Cada etapa fica registrada em `membership_events` — dá para responder
exatamente **por que** alguém virou membro, com data e evidência.

### Se a igreja já tem histórico em papel ou planilha

Existe o caminho de importação (`IMPORTACAO_PLANILHA`). Basta uma planilha com
nome, e-mail ou telefone, e a data de cada culto. Os registros importados
entram com origem identificada, sem passar pelas barreiras antifraude — porque
já foram conferidos por uma pessoa na época.

Recomendação: importe os últimos 12 meses. Isso evita que membros antigos
apareçam como visitantes no primeiro dia de uso.

### Se outro sistema for a fonte da presença

Se a igreja já usa catraca ou outro software, ele pode alimentar o sistema pela
mesma rota (`method: "CATRACA"`), autenticado. O motor de membresia não se
importa de onde veio a presença — só com a nota de confiança.

---

## A regra dos 5 é ajustável sem programador

Os parâmetros ficam na tabela `membership_rules`:

| Parâmetro | Padrão | O que significa |
|---|---|---|
| `minAttendance` | 5 | Presenças necessárias |
| `windowDays` | 30 | Período avaliado |
| `requiresPastoralReview` | sim | Exige confirmação humana antes de virar membro |
| `minTrustScore` | 70 | Nota mínima para a presença contar |
| `inactivityDays` | 120 | Dias sem vir para o membro ficar inativo |

### Por que 30 dias corridos, e não "o mês"

Quem foi dia 28, 29, 30, 1 e 2 esteve na igreja cinco vezes em cinco dias.
Pelo mês-calendário, não seria reconhecido por nenhum dos dois meses. A janela
deslizante reconhece — e é a diferença entre o sistema parecer justo ou
arbitrário para quem frequenta.

### Por que a secretaria ainda confirma

O sistema **detecta** o critério; quem **reconhece** a membresia é a igreja.
Membresia é vínculo pastoral, não troféu de frequência — e desfazer uma
promoção errada é constrangedor. A tela `/painel/membresia` mostra a fila com o
número de presenças de cada pessoa; confirmar leva um clique.

Se a igreja preferir promoção 100% automática, é só desligar
`requiresPastoralReview`.

---

## Implantação sugerida

**Semana 1 — preparo.** Instale a TV ou tablet na entrada. Treine três pessoas
da recepção (leva 15 minutos). Importe o histórico existente, se houver.

**Semanas 2 e 3 — em paralelo.** Mantenha a lista de papel **e** o QR. Compare
os dois no fim de cada culto: a diferença mostra quem ainda não aderiu e onde
está o atrito.

**Semana 4 — só digital.** Tire o papel. A experiência de quem já fez essa
transição é que manter as duas opções indefinidamente faz a adesão estagnar em
60%; remover o papel leva a mais de 90% em duas semanas.

**Sempre.** Deixe alguém da recepção com o tablet, para quem não tem celular,
está sem internet ou simplesmente prefere. Ninguém deve ficar de fora da conta
de membros por causa de tecnologia.

---

## O que dizer para a igreja

Sugestão de aviso no culto:

> "A partir de hoje, quando você chegar, aponte a câmera do celular para o QR
> na entrada. Leva quatro segundos e serve para a gente cuidar melhor de você —
> saber quem está vindo, quem sumiu e quem já faz parte da nossa família. Quem
> não tiver celular, é só falar com a equipe na porta."

Vale explicar o **porquê**, não só o como. Presença registrada não é controle:
é o que permite à igreja perceber que alguém sumiu há três semanas e ligar para
saber se está tudo bem.
