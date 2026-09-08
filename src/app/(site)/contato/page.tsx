import type { Metadata } from 'next';
import { MapPin, Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { ContactForm } from '@/components/ContactForm';
import { Ornament } from '@/components/ui/Section';
import { IGREJA } from '@/lib/site/config';

export const metadata: Metadata = {
  title: 'Fale conosco',
  description: 'Entre em contato com a Missão Evangélica do Brasil. Estamos em Padre Miguel, Rio de Janeiro.',
};

export default function ContatoPage() {
  const whatsapp = `https://wa.me/${IGREJA.contato.whatsapp}`;

  return (
    <>
      <section className="bg-ivory-veil pb-12 pt-[calc(var(--header-h)+64px)]">
        <div className="container text-center">
          <Ornament className="mb-7" />
          <p className="eyebrow mb-4">Fale conosco</p>
          <h1 className="mx-auto max-w-2xl text-display text-ink-900">
            Estamos aqui para <span className="text-gold-foil">te ouvir</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-600">
            Dúvidas, pedidos de visita, aconselhamento ou parcerias — escreva e nossa equipe responde
            em até um dia útil.
          </p>
        </div>
      </section>

      <section className="bg-ivory-50 pb-24">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
            <ContactForm />

            <aside className="space-y-5">
              <div className="card p-6">
                <p className="eyebrow mb-4">Canais diretos</p>
                <ul className="space-y-4 text-[14.5px]">
                  <li className="flex gap-3.5">
                    <Phone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold-600" />
                    <span>
                      <span className="block text-ink-400">Telefone</span>
                      <a href={`tel:${IGREJA.contato.telefone.replace(/\D/g, '')}`} className="font-medium text-ink-900 hover:text-crimson-700">
                        {IGREJA.contato.telefone}
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3.5">
                    <MessageCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold-600" />
                    <span>
                      <span className="block text-ink-400">WhatsApp</span>
                      <a href={whatsapp} target="_blank" rel="noreferrer noopener" className="font-medium text-ink-900 hover:text-crimson-700">
                        Conversar agora
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3.5">
                    <Mail className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold-600" />
                    <span>
                      <span className="block text-ink-400">E-mail</span>
                      <a href={`mailto:${IGREJA.contato.email}`} className="break-all font-medium text-ink-900 hover:text-crimson-700">
                        {IGREJA.contato.email}
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3.5">
                    <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold-600" />
                    <span>
                      <span className="block text-ink-400">Endereço</span>
                      <span className="font-medium text-ink-900">
                        {IGREJA.endereco.logradouro}
                        <br />
                        {IGREJA.endereco.bairro} — {IGREJA.endereco.cidade}/{IGREJA.endereco.estado}
                      </span>
                    </span>
                  </li>
                </ul>
              </div>

              <div className="card p-6">
                <p className="eyebrow mb-4 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Secretaria
                </p>
                <dl className="space-y-2.5 text-[14px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Segunda a sexta</dt>
                    <dd className="tabular font-medium text-ink-900">9h — 18h</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Sábado</dt>
                    <dd className="tabular font-medium text-ink-900">9h — 13h</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Domingo</dt>
                    <dd className="font-medium text-ink-900">Durante os cultos</dd>
                  </div>
                </dl>
              </div>

              <div className="card bg-crimson-deep p-6 text-ivory-100">
                <p className="font-display text-lg">Precisa de oração agora?</p>
                <p className="mt-2 text-[14px] leading-relaxed text-ivory-200/75">
                  Escreva no mural — anonimamente, se preferir. A igreja inteira ora com você.
                </p>
                <a href="/mural" className="btn-gold mt-5 w-full !py-2.5 text-[13.5px]">
                  Ir para o mural
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
