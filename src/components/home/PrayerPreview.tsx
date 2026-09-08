import Link from 'next/link';
import { ArrowRight, HandHeart, Lock, MessagesSquare } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { relativeTime, formatNumber } from '@/lib/utils/format';
import { CATEGORIAS } from '@/lib/prayer-ui';
import type { PedidoPublico } from '@/components/mural/PrayerCard';

export function PrayerPreview({ pedidos, total }: { pedidos: PedidoPublico[]; total: number }) {
  return (
    <section className="section relative overflow-hidden bg-ivory-veil">
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.4]" aria-hidden>
        <defs>
          <pattern id="pontos" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="#E6D7BC" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pontos)" />
      </svg>

      <div className="container relative">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow mb-4 flex items-center gap-2.5">
              <span className="inline-block h-px w-8 bg-gold-400" aria-hidden />
              Mural de orações
            </p>
            <h2 className="text-headline text-ink-900">
              Aqui ninguém carrega o peso <span className="text-gold-foil">sozinho</span>
            </h2>
            <p className="mt-5 text-[16.5px] leading-relaxed text-ink-600">
              Escreva o que está apertando o seu peito — anonimamente, sem julgamento. Irmãos e irmãs
              vão ler, tocar em “Estou orando” e deixar uma palavra de ânimo.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                { Icon: Lock, texto: 'Anônimo por padrão. Telefones e e-mails são removidos automaticamente.' },
                { Icon: HandHeart, texto: `${formatNumber(total)} pedidos já foram compartilhados por esta comunidade.` },
                { Icon: MessagesSquare, texto: 'Moderação ativa e acolhimento imediato em casos de crise.' },
              ].map(({ Icon, texto }) => (
                <li key={texto} className="flex gap-3.5 text-[15px] text-ink-600">
                  <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold-600" />
                  {texto}
                </li>
              ))}
            </ul>

            <Link href="/mural" className="btn-primary group mt-9">
              Escrever meu pedido
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <RevealGroup className="grid gap-4 sm:grid-cols-2">
            {pedidos.slice(0, 4).map((p) => {
              const categoria = CATEGORIAS.find((c) => c.valor === p.category) ?? CATEGORIAS.at(-1)!;
              return (
                <RevealItem key={p.publicId}>
                  <article className="card h-full p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory-200 px-3 py-1 text-[12px] font-semibold text-ink-600">
                        <span aria-hidden>{categoria.emoji}</span>
                        {categoria.rotulo}
                      </span>
                      <time className="text-[11.5px] text-ink-300" dateTime={p.createdAt}>
                        {relativeTime(p.createdAt)}
                      </time>
                    </div>

                    <p className="mt-4 text-[14.5px] leading-relaxed text-ink-700 line-clamp-5">{p.body}</p>

                    <div className="mt-5 flex items-center gap-2 border-t border-ink-100 pt-4 text-[12.5px] text-ink-400">
                      <HandHeart className="h-4 w-4 text-crimson-600" />
                      <span className="tabular font-semibold text-ink-700">{formatNumber(p.prayerCount)}</span>
                      pessoas orando
                    </div>
                  </article>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
