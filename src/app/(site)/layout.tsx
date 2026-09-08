import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getSessionUser } from '@/lib/auth/session';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getSessionUser().catch(() => null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header usuario={usuario ? { fullName: usuario.fullName, roles: usuario.roles } : null} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
