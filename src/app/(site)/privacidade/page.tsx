import type { Metadata } from 'next';
import { Ornament } from '@/components/ui/Section';
import { IGREJA } from '@/lib/site/config';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como a Missão Evangélica do Brasil trata seus dados pessoais, conforme a LGPD.',
};

const SECOES = [
  {
    titulo: '1. Quem somos',
    texto: `A ${IGREJA.nome}, com sede na ${IGREJA.endereco.completo}, é a controladora dos dados pessoais tratados neste site. Nosso encarregado de dados (DPO) pode ser contatado em ${IGREJA.contato.email}.`,
  },
  {
    titulo: '2. Quais dados coletamos',
    texto:
      'Coletamos: (a) dados de cadastro — nome, e-mail, telefone e data de nascimento; (b) dados de participação — presenças registradas nos cultos, inscrições em eventos e interações no mural de orações; (c) dados de pagamento — nome, e-mail e os quatro últimos dígitos do documento, sempre processados pelo nosso provedor de pagamento; (d) dados técnicos — endereço IP e navegador, armazenados apenas em forma anonimizada (hash).',
  },
  {
    titulo: '3. O que NÃO armazenamos',
    texto:
      'Nunca armazenamos o número completo do seu cartão de crédito, o código de segurança (CVV) ou seu CPF em texto legível. Os dados do cartão são enviados diretamente do seu navegador ao provedor de pagamento certificado PCI-DSS. O CPF é guardado apenas como hash irreversível, junto dos quatro últimos dígitos para conferência.',
  },
  {
    titulo: '4. O mural de orações',
    texto:
      'Pedidos publicados como anônimos não são vinculados à sua conta em nosso banco de dados — nem a equipe pastoral consegue identificar o autor. Telefones, e-mails e documentos digitados no texto são removidos automaticamente antes da publicação. Pedidos que sinalizam risco à vida acionam a equipe pastoral para acolhimento.',
  },
  {
    titulo: '5. Base legal e finalidade',
    texto:
      'Tratamos seus dados com base no consentimento (art. 7º, I da LGPD) para comunicação e no legítimo interesse (art. 7º, IX) para a gestão da vida eclesiástica — registro de presença, membresia e inscrições. Dados de pagamento são tratados para execução de contrato (art. 7º, V).',
  },
  {
    titulo: '6. Compartilhamento',
    texto:
      'Compartilhamos dados apenas com: provedores de pagamento (para processar transações), serviço de e-mail transacional (para enviar confirmações) e autoridades públicas quando legalmente exigido. Não vendemos, alugamos ou cedemos dados pessoais a terceiros para fins comerciais.',
  },
  {
    titulo: '7. Retenção',
    texto:
      'Dados de cadastro são mantidos enquanto a conta existir. Registros financeiros são retidos por cinco anos, conforme a legislação fiscal. Pedidos do mural expiram automaticamente em 90 dias. Logs técnicos anonimizados são mantidos por 12 meses.',
  },
  {
    titulo: '8. Seus direitos',
    texto:
      'Você pode, a qualquer momento, solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade ou eliminação dos seus dados, bem como revogar consentimentos. Basta escrever para o nosso encarregado. Responderemos em até 15 dias.',
  },
  {
    titulo: '9. Segurança',
    texto:
      'Adotamos criptografia em trânsito (TLS 1.3), hash com sal e pimenta para senhas (bcrypt), controle de acesso baseado em papéis, registro de auditoria de todas as operações sensíveis e limitação de taxa contra abusos.',
  },
  {
    titulo: '10. Cookies',
    texto:
      'Usamos apenas cookies essenciais para manter você conectado (sessão) e proteger contra fraudes. Não utilizamos cookies de publicidade nem rastreamento de terceiros.',
  },
];

export default function PrivacidadePage() {
  return (
    <section className="bg-ivory-50 pb-24 pt-[calc(var(--header-h)+64px)]">
      <div className="container max-w-3xl">
        <Ornament className="mb-7" />
        <p className="eyebrow mb-4 text-center">Transparência</p>
        <h1 className="text-center text-display text-ink-900">Política de Privacidade</h1>
        <p className="mt-5 text-center text-[15px] text-ink-400">
          Versão 2026.1 · Em conformidade com a Lei 13.709/2018 (LGPD)
        </p>

        <div className="mt-14 space-y-9">
          {SECOES.map((s) => (
            <article key={s.titulo}>
              <h2 className="font-display text-xl text-ink-900">{s.titulo}</h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink-600">{s.texto}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-gold-200 bg-gold-50/50 p-7">
          <h2 className="font-display text-lg text-ink-900">Fale com o encarregado de dados</h2>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-600">
            Dúvidas ou solicitações sobre seus dados:{' '}
            <a href={`mailto:${IGREJA.contato.email}`} className="font-medium text-gold-700 underline">
              {IGREJA.contato.email}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
