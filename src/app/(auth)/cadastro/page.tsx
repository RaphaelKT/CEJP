import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Criar conta',
  description: 'Crie sua conta na Missão Evangélica do Brasil e acompanhe cultos, eventos e o mural de orações.',
};

export default function CadastroPage() {
  return <RegisterForm />;
}
