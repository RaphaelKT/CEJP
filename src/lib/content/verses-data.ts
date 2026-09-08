/**
 * Acervo bíblico embarcado.
 *
 * Módulo sem dependências (nem de banco, nem de `server-only`) para poder
 * ser importado tanto pelo runtime do site quanto pelo script de seed e por
 * qualquer ferramenta de linha de comando.
 */
export const VERSICULOS_BASE: { reference: string; text: string; version: string; theme: string }[] = [
  { reference: 'Salmos 23:1', text: 'O Senhor é o meu pastor; nada me faltará.', version: 'ARA', theme: 'Provisão' },
  { reference: 'Filipenses 4:13', text: 'Tudo posso naquele que me fortalece.', version: 'ARA', theme: 'Força' },
  { reference: 'Isaías 41:10', text: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.', version: 'ARC', theme: 'Coragem' },
  { reference: 'Provérbios 3:5-6', text: 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.', version: 'ARA', theme: 'Direção' },
  { reference: 'Mateus 11:28', text: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.', version: 'ARA', theme: 'Descanso' },
  { reference: 'Romanos 8:28', text: 'Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.', version: 'ARA', theme: 'Propósito' },
  { reference: 'Josué 1:9', text: 'Não to mandei eu? Sê forte e corajoso; não temas, nem te espantes, porque o Senhor, teu Deus, é contigo por onde quer que andares.', version: 'ARA', theme: 'Coragem' },
  { reference: 'Salmos 46:1', text: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.', version: 'ARA', theme: 'Refúgio' },
  { reference: 'João 14:27', text: 'Deixo-vos a paz, a minha paz vos dou; não vo-la dou como a dá o mundo. Não se turbe o vosso coração, nem se atemorize.', version: 'ARA', theme: 'Paz' },
  { reference: 'Jeremias 29:11', text: 'Porque eu bem sei os pensamentos que penso de vós, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.', version: 'ARC', theme: 'Esperança' },
  { reference: 'Salmos 91:1-2', text: 'Aquele que habita no esconderijo do Altíssimo e descansa à sombra do Onipotente diz ao Senhor: Meu refúgio e meu baluarte, Deus meu, em quem confio.', version: 'ARA', theme: 'Proteção' },
  { reference: '2 Coríntios 12:9', text: 'A minha graça te basta, porque o poder se aperfeiçoa na fraqueza.', version: 'ARA', theme: 'Graça' },
  { reference: 'Salmos 121:1-2', text: 'Elevo os olhos para os montes: de onde me virá o socorro? O meu socorro vem do Senhor, que fez o céu e a terra.', version: 'ARA', theme: 'Socorro' },
  { reference: 'Efésios 2:8', text: 'Porque pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus.', version: 'ARA', theme: 'Salvação' },
  { reference: 'Lamentações 3:22-23', text: 'As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade.', version: 'ARA', theme: 'Fidelidade' },
  { reference: 'Hebreus 11:1', text: 'Ora, a fé é a certeza de coisas que se esperam, a convicção de fatos que se não veem.', version: 'ARA', theme: 'Fé' },
  { reference: 'Salmos 37:5', text: 'Entrega o teu caminho ao Senhor, confia nele, e o mais ele fará.', version: 'ARA', theme: 'Entrega' },
  { reference: '1 Pedro 5:7', text: 'Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.', version: 'ARA', theme: 'Cuidado' },
  { reference: 'Mateus 6:33', text: 'Buscai, pois, em primeiro lugar, o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas.', version: 'ARA', theme: 'Prioridade' },
  { reference: 'Salmos 34:18', text: 'Perto está o Senhor dos que têm o coração quebrantado e salva os de espírito oprimido.', version: 'ARA', theme: 'Consolo' },
  { reference: 'Gálatas 5:22-23', text: 'Mas o fruto do Espírito é: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão, domínio próprio.', version: 'ARA', theme: 'Caráter' },
  { reference: 'Isaías 40:31', text: 'Mas os que esperam no Senhor renovam as suas forças, sobem com asas como águias, correm e não se cansam, caminham e não se fatigam.', version: 'ARA', theme: 'Renovo' },
  { reference: 'Salmos 119:105', text: 'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.', version: 'ARA', theme: 'Palavra' },
  { reference: 'Romanos 12:12', text: 'Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.', version: 'ARA', theme: 'Perseverança' },
  { reference: 'Tiago 1:5', text: 'Se, porém, algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente e nada lhes impropera; e ser-lhe-á concedida.', version: 'ARA', theme: 'Sabedoria' },
  { reference: '1 Coríntios 13:13', text: 'Agora, pois, permanecem a fé, a esperança e o amor, estes três; porém o maior destes é o amor.', version: 'ARA', theme: 'Amor' },
  { reference: 'Salmos 27:1', text: 'O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a fortaleza da minha vida; de quem me recearei?', version: 'ARA', theme: 'Confiança' },
  { reference: 'Marcos 11:24', text: 'Por isso, vos digo: tudo quanto em oração pedirdes, crede que recebestes, e será assim convosco.', version: 'ARA', theme: 'Oração' },
  { reference: 'Colossenses 3:23', text: 'Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens.', version: 'ARA', theme: 'Trabalho' },
  { reference: 'Salmos 133:1', text: 'Oh! Como é bom e quão suave é que os irmãos vivam em união!', version: 'ARA', theme: 'Comunhão' },
  { reference: 'Apocalipse 21:4', text: 'E lhes enxugará dos olhos toda lágrima, e a morte já não existirá, já não haverá luto, nem pranto, nem dor.', version: 'ARA', theme: 'Esperança' },
];
