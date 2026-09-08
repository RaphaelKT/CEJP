import Link from 'next/link';
import { Instagram, Youtube, Facebook, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IGREJA, NAV_RODAPE } from '@/lib/site/config';

export function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-ivory-200">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,#C8992B,transparent)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: 'radial-gradient(circle,#C8992B,transparent 70%)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-52 -right-20 h-[28rem] w-[28rem] rounded-full opacity-[0.09] blur-3xl"
        style={{ background: 'radial-gradient(circle,#A31621,transparent 70%)' }}
        aria-hidden
      />

      <div className="container relative py-20">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <Logo className="h-11 w-auto" />
              <div className="leading-none">
                <p className="font-display text-lg font-semibold text-ivory-50">Missão Evangélica</p>
                <p className="text-2xs font-semibold uppercase tracking-[0.3em] text-gold-400">do Brasil</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ivory-200/70">
              Desde {IGREJA.fundacao} anunciando o Evangelho no Rio de Janeiro e enviando missionários
              ao redor do mundo. Aqui você encontra uma família.
            </p>

            <ul className="mt-8 space-y-3.5 text-[14.5px]">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <span className="text-ivory-200/80">
                  {IGREJA.endereco.logradouro}
                  <br />
                  {IGREJA.endereco.bairro} — {IGREJA.endereco.cidade}/{IGREJA.endereco.estado}
                  <br />
                  CEP {IGREJA.endereco.cep}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-gold-400" />
                <a href={`tel:${IGREJA.contato.telefone.replace(/\D/g, '')}`} className="text-ivory-200/80 hover:text-gold-300">
                  {IGREJA.contato.telefone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-gold-400" />
                <a href={`mailto:${IGREJA.contato.email}`} className="break-all text-ivory-200/80 hover:text-gold-300">
                  {IGREJA.contato.email}
                </a>
              </li>
            </ul>

            <div className="mt-8 flex gap-2.5">
              {[
                { href: IGREJA.redes.instagram, Icon: Instagram, label: 'Instagram' },
                { href: IGREJA.redes.youtube, Icon: Youtube, label: 'YouTube' },
                { href: IGREJA.redes.facebook, Icon: Facebook, label: 'Facebook' },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-ivory-200/15 text-ivory-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-400/60 hover:text-gold-300"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {NAV_RODAPE.map((coluna) => (
              <div key={coluna.titulo}>
                <h3 className="text-2xs font-semibold uppercase tracking-[0.22em] text-gold-400">
                  {coluna.titulo}
                </h3>
                <ul className="mt-5 space-y-3">
                  {coluna.itens.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group inline-flex items-center gap-1.5 text-[14.5px] text-ivory-200/70 transition-colors hover:text-ivory-50"
                      >
                        {item.label}
                        <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ivory-200/10 pt-8 text-[13px] text-ivory-200/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {ano} {IGREJA.nome}. Todos os direitos reservados. CNPJ 00.000.000/0001-00
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-olive-400" />
            Dados tratados conforme a LGPD (Lei 13.709/2018)
          </p>
        </div>
      </div>
    </footer>
  );
}
