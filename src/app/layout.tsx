import type { Metadata, Viewport } from 'next';
import './globals.css';
import { IGREJA } from '@/lib/site/config';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: {
    default: `${IGREJA.nome} — ${IGREJA.lema}`,
    template: `%s · ${IGREJA.nome}`,
  },
  description:
    'Somos uma igreja evangélica no Rio de Janeiro com mais de três décadas de história. Cultos semanais, mural de orações, retiros, congressos e missões ao redor do mundo.',
  keywords: [
    'igreja evangélica',
    'Padre Miguel',
    'Rio de Janeiro',
    'culto',
    'retiro de carnaval',
    'JUMEB',
    'missões',
    'oração',
  ],
  authors: [{ name: IGREJA.nome }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: IGREJA.nome,
    title: `${IGREJA.nome} — ${IGREJA.lema}`,
    description:
      'Cultos, eventos, retiros e um mural de orações onde ninguém carrega o peso sozinho. Venha nos visitar em Padre Miguel, Rio de Janeiro.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFDF9' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0A08' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const dadosEstruturados = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: IGREJA.nome,
    url: process.env.APP_URL ?? 'http://localhost:3000',
    telephone: IGREJA.contato.telefone,
    email: IGREJA.contato.email,
    foundingDate: String(IGREJA.fundacao),
    address: {
      '@type': 'PostalAddress',
      streetAddress: IGREJA.endereco.logradouro,
      addressLocality: IGREJA.endereco.cidade,
      addressRegion: IGREJA.endereco.estado,
      postalCode: IGREJA.endereco.cep,
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: IGREJA.coordenadas.latitude,
      longitude: IGREJA.coordenadas.longitude,
    },
    sameAs: Object.values(IGREJA.redes),
  };

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-crimson-700 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
