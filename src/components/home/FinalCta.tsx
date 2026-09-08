import Link from 'next/link';
import { ArrowRight, MessageCircle, UserPlus } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { Ornament } from '@/components/ui/Section';
import { IGREJA } from '@/lib/site/config';

export function FinalCta() {
  const whatsapp = `https://wa.me/${IGREJA.contato.whatsapp}?text=${encodeURIComponent(
    'Olá! Vi o site da Missão Evangélica do Brasil e gostaria de visitar a igreja.',
  )}`;

  return (
    <section className="relative overflow-hidden bg-ivory-100 py-24 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(241,220,156,.5), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(163,22,33,.08), transparent 55%)',
        }}
        aria-hidden
      />

      <div className="container relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Ornament className="mb-8" />
          <h2 className="text-headline text-ink-900">
            Sua primeira vez aqui pode ser <span className="text-gold-foil">neste domingo</span>
          </h2>
          <p className="mt-6 text-[17px] leading-relaxed text-ink-600">
            Não precisa de convite, roupa especial ou saber os hinos. Chegue como você está — nossa
            equipe de acolhimento vai te encontrar na porta e sentar do seu lado se você quiser.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/cadastro" className="btn-primary group">
              <UserPlus className="h-4 w-4" />
              Criar minha conta
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a href={whatsapp} target="_blank" rel="noreferrer noopener" className="btn-outline">
              <MessageCircle className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          </div>

          <p className="mt-8 text-[13px] text-ink-400">
            Ao criar sua conta você acompanha suas inscrições, presenças e o mural de orações.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
