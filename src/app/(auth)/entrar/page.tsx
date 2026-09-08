import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } };

export default function EntrarPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-ivory-200" />}>
      <LoginForm />
    </Suspense>
  );
}
