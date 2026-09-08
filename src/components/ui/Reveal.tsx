'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Animação de entrada ao entrar na viewport.
 * Respeita `prefers-reduced-motion` — sem exceções.
 */
const variantes: Variants = {
  oculto: { opacity: 0, y: 22, filter: 'blur(6px)' },
  visivel: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const reduzir = useReducedMotion();
  const Componente = motion[as];

  if (reduzir) return <div className={className}>{children}</div>;

  return (
    <Componente
      className={className}
      variants={variantes}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Componente>
  );
}

/** Escalonamento de filhos — usado em grades de cards. */
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduzir = useReducedMotion();
  if (reduzir) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ visivel: { transition: { staggerChildren: 0.09 } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduzir = useReducedMotion();
  if (reduzir) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={variantes}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
