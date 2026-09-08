import { z } from 'zod';

/** Schemas compartilhados entre formulários (cliente) e rotas (servidor). */

const nomeCompleto = z
  .string()
  .trim()
  .min(5, 'Informe o nome completo.')
  .max(120, 'Nome muito longo.')
  .refine((v) => v.split(/\s+/).length >= 2, 'Informe nome e sobrenome.');

const senhaForte = z
  .string()
  .min(8, 'A senha precisa de pelo menos 8 caracteres.')
  .max(72, 'A senha é muito longa.')
  .refine((v) => /[a-zà-ú]/.test(v), 'Inclua ao menos uma letra minúscula.')
  .refine((v) => /[A-ZÀ-Ú]/.test(v), 'Inclua ao menos uma letra maiúscula.')
  .refine((v) => /\d/.test(v), 'Inclua ao menos um número.');

const telefoneBR = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 0 || v.length === 10 || v.length === 11, 'Telefone inválido.');

export const registerSchema = z
  .object({
    fullName: nomeCompleto,
    email: z.string().trim().toLowerCase().email('E-mail inválido.'),
    phone: telefoneBR.optional(),
    birthDate: z.string().optional(),
    password: senhaForte,
    confirmPassword: z.string(),
    acceptPrivacy: z.literal(true, {
      errorMap: () => ({ message: 'É necessário aceitar a Política de Privacidade.' }),
    }),
    marketingOptIn: z.boolean().optional().default(false),
    homeChurchSlug: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe sua senha.'),
  remember: z.boolean().optional().default(true),
});

export const prayerRequestSchema = z.object({
  body: z
    .string()
    .trim()
    .min(15, 'Escreva um pouco mais para que possamos orar com você.')
    .max(1200, 'Limite de 1200 caracteres.'),
  title: z.string().trim().max(90).optional(),
  category: z
    .enum([
      'SAUDE',
      'FAMILIA',
      'TRABALHO_E_PROVISAO',
      'ESTUDOS',
      'ESPIRITUAL',
      'RELACIONAMENTOS',
      'LUTO',
      'GRATIDAO',
      'OUTRO',
    ])
    .default('OUTRO'),
  anonymous: z.boolean().default(true),
  displayName: z.string().trim().max(60).optional(),
  urgent: z.boolean().default(false),
});

export const prayerReplySchema = z.object({
  requestId: z.string().min(1),
  body: z.string().trim().min(3, 'Escreva sua palavra de ânimo.').max(400),
  anonymous: z.boolean().default(true),
  displayName: z.string().trim().max(60).optional(),
});

export const checkoutSchema = z.object({
  editionSlug: z.string().min(1),
  tierId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10),
  buyer: z.object({
    name: nomeCompleto,
    email: z.string().trim().toLowerCase().email('E-mail inválido.'),
    phone: telefoneBR,
    document: z
      .string()
      .transform((v) => v.replace(/\D/g, ''))
      .refine((v) => v.length === 11 || v.length === 14, 'CPF ou CNPJ inválido.'),
  }),
  participants: z
    .array(
      z.object({
        name: nomeCompleto,
        email: z.string().trim().toLowerCase().email('E-mail inválido.'),
        phone: telefoneBR.optional(),
        birthDate: z.string().optional(),
        shirtSize: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: telefoneBR.optional(),
        healthNotes: z.string().max(500).optional(),
        dietaryNotes: z.string().max(300).optional(),
      }),
    )
    .min(1),
  method: z.enum(['PIX', 'CARTAO_CREDITO', 'BOLETO']),
  installments: z.coerce.number().int().min(1).max(12).default(1),
  couponCode: z.string().trim().toUpperCase().optional(),
  card: z
    .object({
      token: z.string().min(1), // token gerado no navegador — o servidor NUNCA vê o PAN
      brand: z.string().optional(),
      last4: z.string().length(4).optional(),
      holderName: z.string().optional(),
    })
    .optional(),
  idempotencyKey: z.string().min(8).max(64),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const mediaReportSchema = z.object({
  contextKind: z.enum(['EVENTO', 'CULTO', 'MISSAO', 'ACAO_SOCIAL']),
  editionId: z.string().optional(),
  occurrenceLabel: z.string().optional(),
  eventYear: z.coerce.number().int().min(1990).max(2100),
  capturedOn: z.string().min(8, 'Informe a data em que as fotos foram tiradas.'),
  venueId: z.string().min(1, 'Selecione o local da captação.'),
  photographer: z.string().trim().max(80).optional(),
  caption: z.string().trim().max(240).optional(),
  tags: z.array(z.string()).max(12).default([]),
  hasMinors: z.boolean().default(false),
  consentConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirme que há autorização de uso de imagem.' }),
  }),
});

export const contactSchema = z.object({
  name: nomeCompleto,
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  phone: telefoneBR.optional(),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

/** Normaliza erros do Zod para o formato consumido pelos formulários. */
export function fieldErrors(error: z.ZodError) {
  const flat = error.flatten();
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
    if (msgs?.[0]) out[key] = msgs[0];
  }
  if (flat.formErrors[0]) out._form = flat.formErrors[0];
  return out;
}
