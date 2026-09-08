import type { Metadata } from 'next';
import { Ornament } from '@/components/ui/Section';
import { IGREJA } from '@/lib/site/config';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Termos e condições de uso da plataforma digital da Missão Evangélica do Brasil.',
};

const SECOES = [
  { titulo: '1. Aceite', texto: `Ao criar uma conta ou utilizar este site você concorda com estes termos e com a Política de Privacidade da ${IGREJA.nome}.` },
  { titulo: '2. Sua conta', texto: 'Você é responsável por manter sua senha em sigilo e por toda atividade realizada com suas credenciais. Informe imediatamente a secretaria em caso de acesso não autorizado. Contas com dados falsos podem ser suspensas.' },
  { titulo: '3. Mural de orações', texto: 'O mural é um espaço de acolhimento. É proibido publicar ofensas, discurso de ódio, divulgação comercial, correntes, dados de terceiros ou qualquer conteúdo ilegal. Textos passam por triagem automática e podem ser removidos pela equipe pastoral. Pedidos anônimos permanecem anônimos.' },
  { titulo: '4. Inscrições em eventos', texto: 'A inscrição só é confirmada após a compensação do pagamento. Vagas são reservadas por até 60 minutos aguardando pagamento; após esse prazo retornam ao estoque. Cada participante recebe um código individual e intransferível, salvo autorização expressa da secretaria.' },
  { titulo: '5. Pagamentos e reembolsos', texto: 'Os pagamentos são processados por provedores certificados. A política de reembolso de cada evento é publicada na sua página e, por padrão, devolve 100% até 45 dias antes, 80% até 30 dias, 50% até 15 dias e 30% até 7 dias antes do início. Cancelamentos com menos de 7 dias não geram reembolso, exceto por motivo de saúde comprovado, avaliado caso a caso.' },
  { titulo: '6. Registro de presença', texto: 'O registro de presença é pessoal. Tentar registrar presença sem estar no local, usar o QR de outra pessoa ou falsificar localização são condutas que invalidam os registros e podem levar à suspensão da conta.' },
  { titulo: '7. Membresia', texto: 'A membresia é reconhecida pela igreja após critério de frequência e confirmação pastoral. Não é adquirida por pagamento nem por autodeclaração, e pode ser revista pela liderança conforme o estatuto.' },
  { titulo: '8. Uso de imagem', texto: 'Cultos e eventos podem ser fotografados e transmitidos. Ao participar, você autoriza o uso institucional dessas imagens. Se não desejar aparecer, comunique a equipe de mídia na entrada — respeitaremos e removeremos registros mediante solicitação.' },
  { titulo: '9. Propriedade intelectual', texto: 'Textos, marcas, logotipos, fotografias e o código desta plataforma pertencem à igreja. É permitido compartilhar conteúdo com atribuição; é vedada a reprodução comercial sem autorização.' },
  { titulo: '10. Disponibilidade e alterações', texto: 'Trabalhamos para manter o serviço disponível, mas ele pode ser interrompido para manutenção. Estes termos podem ser atualizados; mudanças relevantes serão comunicadas por e-mail com 15 dias de antecedência.' },
  { titulo: '11. Foro', texto: 'Fica eleito o foro da Comarca da Capital do Rio de Janeiro para dirimir questões oriundas destes termos.' },
];

export default function TermosPage() {
  return (
    <section className="bg-ivory-50 pb-24 pt-[calc(var(--header-h)+64px)]">
      <div className="container max-w-3xl">
        <Ornament className="mb-7" />
        <p className="eyebrow mb-4 text-center">Transparência</p>
        <h1 className="text-center text-display text-ink-900">Termos de uso</h1>
        <p className="mt-5 text-center text-[15px] text-ink-400">Versão 2026.1</p>

        <div className="mt-14 space-y-9">
          {SECOES.map((s) => (
            <article key={s.titulo}>
              <h2 className="font-display text-xl text-ink-900">{s.titulo}</h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink-600">{s.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
