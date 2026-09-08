-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VISITANTE', 'MEMBRO', 'LIDER', 'MIDIA', 'TESOURARIA', 'SECRETARIA', 'PASTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "MembershipStage" AS ENUM ('VISITANTE', 'FREQUENTADOR', 'EM_AVALIACAO', 'MEMBRO', 'MEMBRO_INATIVO', 'DESLIGADO');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDENTE_VERIFICACAO', 'ATIVO', 'SUSPENSO', 'BANIDO');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO', 'NAO_INFORMADO');

-- CreateEnum
CREATE TYPE "TokenPurpose" AS ENUM ('VERIFICACAO_EMAIL', 'RESET_SENHA', 'CONVITE_EQUIPE', 'MAGIC_LINK', 'CONFIRMACAO_TELEFONE');

-- CreateEnum
CREATE TYPE "ChurchStatus" AS ENUM ('SEDE', 'CONGREGACAO', 'PONTO_DE_PREGACAO', 'MISSAO_INTERNACIONAL', 'INAUGURACAO_PREVISTA');

-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('CULTO_CELEBRACAO', 'CULTO_ORACAO', 'CULTO_ENSINO', 'ESCOLA_BIBLICA', 'CULTO_JOVENS', 'CULTO_INFANTIL', 'VIGILIA', 'CELULA');

-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('QR_ROTATIVO', 'QR_CARTEIRINHA', 'NFC', 'GEOFENCE_APP', 'MANUAL_SECRETARIA', 'IMPORTACAO_PLANILHA', 'CATRACA');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('CONFIRMADO', 'PENDENTE', 'SUSPEITO', 'REJEITADO', 'DUPLICADO');

-- CreateEnum
CREATE TYPE "MembershipEventType" AS ENUM ('PRESENCA_REGISTRADA', 'GATILHO_ATINGIDO', 'PROMOVIDO_A_MEMBRO', 'CONFIRMADO_PASTORAL', 'REVERTIDO', 'INATIVADO', 'REATIVADO', 'DESLIGADO', 'AJUSTE_MANUAL');

-- CreateEnum
CREATE TYPE "PrayerCategory" AS ENUM ('SAUDE', 'FAMILIA', 'TRABALHO_E_PROVISAO', 'ESTUDOS', 'ESPIRITUAL', 'RELACIONAMENTOS', 'LUTO', 'GRATIDAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "PrayerStatus" AS ENUM ('PENDENTE_MODERACAO', 'PUBLICADO', 'RESPONDIDO', 'ARQUIVADO', 'REMOVIDO');

-- CreateEnum
CREATE TYPE "PrayerInteractionKind" AS ENUM ('ESTOU_ORANDO', 'AMEM', 'ABRACO');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('ABERTO', 'APROVADO', 'REPROVADO', 'ESCALADO');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('RETIRO', 'CONGRESSO', 'MISSAO', 'ACAMPAMENTO', 'CONFERENCIA', 'ENCONTRO_JOVENS', 'SEMINARIO', 'ACAO_SOCIAL');

-- CreateEnum
CREATE TYPE "EventEditionStatus" AS ENUM ('RASCUNHO', 'INSCRICOES_EM_BREVE', 'INSCRICOES_ABERTAS', 'LISTA_DE_ESPERA', 'INSCRICOES_ENCERRADAS', 'EM_ANDAMENTO', 'REALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TicketAudience" AS ENUM ('GERAL', 'MEMBRO', 'CRIANCA', 'ADOLESCENTE', 'JOVEM', 'CASAL', 'TERCEIRA_IDADE', 'VOLUNTARIO', 'CONVIDADO');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('RASCUNHO', 'AGUARDANDO_PAGAMENTO', 'CONFIRMADA', 'LISTA_DE_ESPERA', 'CANCELADA', 'REEMBOLSADA', 'CHECK_IN_REALIZADO', 'NAO_COMPARECEU');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ABERTO', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'PARCIALMENTE_PAGO', 'EXPIRADO', 'CANCELADO', 'ESTORNADO', 'EM_DISPUTA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA', 'CORTESIA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CRIADO', 'PENDENTE', 'EM_ANALISE', 'AUTORIZADO', 'CAPTURADO', 'RECUSADO', 'CANCELADO', 'EXPIRADO', 'ESTORNADO_PARCIAL', 'ESTORNADO_TOTAL', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADO_PAGO', 'STRIPE', 'ASAAS', 'PAGARME', 'MANUAL', 'SANDBOX');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('SOLICITADO', 'APROVADO', 'PROCESSANDO', 'CONCLUIDO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "DonationKind" AS ENUM ('DIZIMO', 'OFERTA', 'MISSOES', 'OBRA', 'ACAO_SOCIAL');

-- CreateEnum
CREATE TYPE "MediaSubmissionStatus" AS ENUM ('RASCUNHO', 'EM_VALIDACAO', 'APROVADO_AUTOMATICO', 'AGUARDANDO_REVISAO', 'REPROVADO', 'PUBLICADO');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('RECEBIDO', 'PROCESSANDO', 'VALIDADO', 'REPROVADO', 'PUBLICADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP', 'PUSH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT,
    "phoneVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "fullName" TEXT NOT NULL,
    "socialName" TEXT,
    "slugName" TEXT,
    "avatarUrl" TEXT,
    "birthDate" DATE,
    "gender" "Gender" NOT NULL DEFAULT 'NAO_INFORMADO',
    "cpfHash" TEXT,
    "cpfLast4" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDENTE_VERIFICACAO',
    "roles" "Role"[] DEFAULT ARRAY['VISITANTE']::"Role"[],
    "membershipStage" "MembershipStage" NOT NULL DEFAULT 'VISITANTE',
    "membershipSince" TIMESTAMP(3),
    "membershipNumber" TEXT,
    "baptizedAt" TIMESTAMP(3),
    "conversionDate" TIMESTAMP(3),
    "discipleshipStatus" TEXT,
    "homeChurchId" TEXT,
    "householdId" TEXT,
    "addressStreet" TEXT,
    "addressNumber" TEXT,
    "addressExtra" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT true,
    "privacyPolicyVersion" TEXT,
    "privacyAcceptedAt" TIMESTAMP(3),
    "dataDeletionRequestedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryPhone" TEXT,
    "addressStreet" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "deviceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "identifier" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "TokenPurpose" NOT NULL,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churches" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ChurchStatus" NOT NULL DEFAULT 'CONGREGACAO',
    "official" BOOLEAN NOT NULL DEFAULT true,
    "foundedAt" TIMESTAMP(3),
    "pastorName" TEXT,
    "coverUrl" TEXT,
    "about" TEXT,
    "venueId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'BR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'BR',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geofenceRadiusM" INTEGER NOT NULL DEFAULT 350,
    "placeId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_schedules" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "kind" "ServiceKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "audience" TEXT,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_occurrences" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT,
    "venueId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "theme" TEXT,
    "preacher" TEXT,
    "checkInWindowMin" INTEGER NOT NULL DEFAULT 45,
    "attendanceCount" INTEGER NOT NULL DEFAULT 0,
    "canceled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ministries" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconKey" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ministries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ministry_memberships" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'voluntario',
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "until" TIMESTAMP(3),

    CONSTRAINT "ministry_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "method" "CheckInMethod" NOT NULL,
    "status" "CheckInStatus" NOT NULL DEFAULT 'CONFIRMADO',
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracyM" DOUBLE PRECISION,
    "distanceM" DOUBLE PRECISION,
    "deviceHash" TEXT,
    "ipHash" TEXT,
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "trustSignals" JSONB,
    "recordedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_in_tokens" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 2000,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "check_in_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MembershipEventType" NOT NULL,
    "fromStage" "MembershipStage",
    "toStage" "MembershipStage",
    "period" TEXT,
    "evidence" JSONB,
    "actorId" TEXT,
    "automatic" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_rules" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "minAttendance" INTEGER NOT NULL DEFAULT 5,
    "windowDays" INTEGER NOT NULL DEFAULT 30,
    "requiresPastoralReview" BOOLEAN NOT NULL DEFAULT true,
    "minTrustScore" INTEGER NOT NULL DEFAULT 70,
    "inactivityDays" INTEGER NOT NULL DEFAULT 120,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_requests" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "authorId" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT,
    "category" "PrayerCategory" NOT NULL DEFAULT 'OUTRO',
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" "PrayerStatus" NOT NULL DEFAULT 'PUBLICADO',
    "prayerCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorFingerprint" TEXT,
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "toxicityScore" DOUBLE PRECISION,
    "autoFlagged" BOOLEAN NOT NULL DEFAULT false,
    "moderationNote" TEXT,
    "testimony" TEXT,
    "answeredAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prayer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_interactions" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT,
    "fingerprint" TEXT NOT NULL,
    "kind" "PrayerInteractionKind" NOT NULL DEFAULT 'ESTOU_ORANDO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_replies" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorId" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT,
    "body" TEXT NOT NULL,
    "fingerprint" TEXT,
    "toxicityScore" DOUBLE PRECISION,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_cases" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "prayerRequestId" TEXT,
    "reason" TEXT NOT NULL,
    "signals" JSONB,
    "status" "ModerationStatus" NOT NULL DEFAULT 'ABERTO',
    "reviewerId" TEXT,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "category" "EventCategory" NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "accentColor" TEXT,
    "iconKey" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_editions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "status" "EventEditionStatus" NOT NULL DEFAULT 'RASCUNHO',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "registrationOpensAt" TIMESTAMP(3),
    "registrationClosesAt" TIMESTAMP(3),
    "venueId" TEXT,
    "churchId" TEXT,
    "locationLabel" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'BR',
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "waitlistCount" INTEGER NOT NULL DEFAULT 0,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "coverImageUrl" TEXT,
    "trailerUrl" TEXT,
    "highlights" JSONB,
    "schedule" JSONB,
    "faq" JSONB,
    "whatToBring" JSONB,
    "refundPolicy" JSONB,
    "installmentsMax" INTEGER NOT NULL DEFAULT 6,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_tiers" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "audience" "TicketAudience" NOT NULL DEFAULT 'GERAL',
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "salesStartAt" TIMESTAMP(3),
    "salesEndAt" TIMESTAMP(3),
    "quantityTotal" INTEGER NOT NULL DEFAULT 0,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "minPerOrder" INTEGER NOT NULL DEFAULT 1,
    "maxPerOrder" INTEGER NOT NULL DEFAULT 10,
    "includesLodging" BOOLEAN NOT NULL DEFAULT false,
    "includesMeals" BOOLEAN NOT NULL DEFAULT false,
    "includesTransport" BOOLEAN NOT NULL DEFAULT false,
    "benefits" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'RASCUNHO',
    "participantName" TEXT NOT NULL,
    "participantEmail" TEXT NOT NULL,
    "participantPhone" TEXT,
    "participantBirth" DATE,
    "participantDocLast4" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "healthNotes" TEXT,
    "dietaryNotes" TEXT,
    "shirtSize" TEXT,
    "roomPreference" TEXT,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "guardianName" TEXT,
    "guardianDocLast4" TEXT,
    "guardianConsentAt" TIMESTAMP(3),
    "qrCodePayload" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'ABERTO',
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "buyerDocLast4" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "paidCents" INTEGER NOT NULL DEFAULT 0,
    "refundedCents" INTEGER NOT NULL DEFAULT 0,
    "couponId" TEXT,
    "idempotencyKey" TEXT,
    "riskScore" INTEGER,
    "riskSignals" JSONB,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "editionId" TEXT,
    "tierId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'INSCRICAO',
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "percentOff" INTEGER,
    "amountOffCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "maxRedemptions" INTEGER,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "minOrderCents" INTEGER NOT NULL DEFAULT 0,
    "restrictedToEditionId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CRIADO',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "capturedCents" INTEGER NOT NULL DEFAULT 0,
    "refundedCents" INTEGER NOT NULL DEFAULT 0,
    "providerFeeCents" INTEGER NOT NULL DEFAULT 0,
    "netCents" INTEGER NOT NULL DEFAULT 0,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "providerPaymentId" TEXT,
    "providerOrderId" TEXT,
    "providerStatusRaw" TEXT,
    "pixQrCode" TEXT,
    "pixQrCodeBase64" TEXT,
    "pixExpiresAt" TIMESTAMP(3),
    "boletoUrl" TEXT,
    "boletoBarcode" TEXT,
    "boletoDueDate" TIMESTAMP(3),
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardHolderName" TEXT,
    "authorizationCode" TEXT,
    "idempotencyKey" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "riskScore" INTEGER,
    "authorizedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "fromStatus" "PaymentStatus",
    "toStatus" "PaymentStatus" NOT NULL,
    "source" TEXT NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "httpStatus" INTEGER,
    "latencyMs" INTEGER,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'SOLICITADO',
    "providerRefundId" TEXT,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concludedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "account" TEXT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,
    "totalCents" INTEGER NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "churchId" TEXT,
    "paymentId" TEXT,
    "kind" "DonationKind" NOT NULL DEFAULT 'OFERTA',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "competencyMonth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "signature" TEXT,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_submissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "status" "MediaSubmissionStatus" NOT NULL DEFAULT 'RASCUNHO',
    "editionId" TEXT,
    "occurrenceLabel" TEXT,
    "contextKind" TEXT NOT NULL DEFAULT 'EVENTO',
    "eventYear" INTEGER,
    "capturedOn" DATE,
    "venueId" TEXT,
    "photographer" TEXT,
    "caption" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasMinors" BOOLEAN NOT NULL DEFAULT false,
    "consentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "assetCount" INTEGER NOT NULL DEFAULT 0,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "validationScore" INTEGER,
    "validationReport" JSONB,
    "feedbackMessage" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'RECEBIDO',
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "blurhash" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "perceptualHash" TEXT,
    "sha256" TEXT,
    "capturedAt" TIMESTAMP(3),
    "cameraMake" TEXT,
    "cameraModel" TEXT,
    "exifLatitude" DOUBLE PRECISION,
    "exifLongitude" DOUBLE PRECISION,
    "exifAltitude" DOUBLE PRECISION,
    "hasGps" BOOLEAN NOT NULL DEFAULT false,
    "distanceToVenueM" DOUBLE PRECISION,
    "validationSignals" JSONB,
    "validationScore" INTEGER,
    "rejectionCode" TEXT,
    "rejectionMessage" TEXT,
    "autoTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "altText" TEXT,
    "faceCount" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "editionId" TEXT,
    "year" INTEGER,
    "coverUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verses" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'ARA',
    "theme" TEXT,
    "rotationIndex" SERIAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_verses" (
    "id" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "verseId" TEXT NOT NULL,
    "reflection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_verses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eyebrow" TEXT,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "focalPoint" TEXT DEFAULT 'center',
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "secondaryLabel" TEXT,
    "secondaryHref" TEXT,
    "badge" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "coverUrl" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "template" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat_counters" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "previousValue" INTEGER NOT NULL DEFAULT 0,
    "suffix" TEXT,
    "iconKey" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stat_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat_snapshots" (
    "id" TEXT NOT NULL,
    "counterId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stat_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_runs" (
    "id" TEXT NOT NULL,
    "jobKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "result" JSONB,
    "error" TEXT,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_publicId_key" ON "users"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_slugName_key" ON "users"("slugName");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpfHash_key" ON "users"("cpfHash");

-- CreateIndex
CREATE UNIQUE INDEX "users_membershipNumber_key" ON "users"("membershipNumber");

-- CreateIndex
CREATE INDEX "users_membershipStage_homeChurchId_idx" ON "users"("membershipStage", "homeChurchId");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_city_state_idx" ON "users"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshTokenHash_key" ON "sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_revokedAt_idx" ON "sessions"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_tokenHash_key" ON "verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "verification_tokens_identifier_purpose_idx" ON "verification_tokens"("identifier", "purpose");

-- CreateIndex
CREATE INDEX "consent_records_userId_kind_idx" ON "consent_records"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "churches_slug_key" ON "churches"("slug");

-- CreateIndex
CREATE INDEX "churches_official_status_idx" ON "churches"("official", "status");

-- CreateIndex
CREATE INDEX "venues_city_state_idx" ON "venues"("city", "state");

-- CreateIndex
CREATE INDEX "service_schedules_churchId_weekday_active_idx" ON "service_schedules"("churchId", "weekday", "active");

-- CreateIndex
CREATE INDEX "service_occurrences_startsAt_idx" ON "service_occurrences"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ministries_churchId_slug_key" ON "ministries"("churchId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ministry_memberships_ministryId_userId_key" ON "ministry_memberships"("ministryId", "userId");

-- CreateIndex
CREATE INDEX "check_ins_checkedInAt_idx" ON "check_ins"("checkedInAt");

-- CreateIndex
CREATE INDEX "check_ins_userId_status_checkedInAt_idx" ON "check_ins"("userId", "status", "checkedInAt");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_userId_occurrenceId_key" ON "check_ins"("userId", "occurrenceId");

-- CreateIndex
CREATE UNIQUE INDEX "check_in_tokens_code_key" ON "check_in_tokens"("code");

-- CreateIndex
CREATE INDEX "check_in_tokens_occurrenceId_expiresAt_idx" ON "check_in_tokens"("occurrenceId", "expiresAt");

-- CreateIndex
CREATE INDEX "membership_events_userId_createdAt_idx" ON "membership_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "membership_events_type_createdAt_idx" ON "membership_events"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "membership_rules_key_key" ON "membership_rules"("key");

-- CreateIndex
CREATE UNIQUE INDEX "prayer_requests_publicId_key" ON "prayer_requests"("publicId");

-- CreateIndex
CREATE INDEX "prayer_requests_status_publishedAt_idx" ON "prayer_requests"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "prayer_requests_category_status_idx" ON "prayer_requests"("category", "status");

-- CreateIndex
CREATE INDEX "prayer_requests_authorFingerprint_createdAt_idx" ON "prayer_requests"("authorFingerprint", "createdAt");

-- CreateIndex
CREATE INDEX "prayer_interactions_requestId_createdAt_idx" ON "prayer_interactions"("requestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "prayer_interactions_requestId_fingerprint_kind_key" ON "prayer_interactions"("requestId", "fingerprint", "kind");

-- CreateIndex
CREATE INDEX "prayer_replies_requestId_createdAt_idx" ON "prayer_replies"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_cases_status_createdAt_idx" ON "moderation_cases"("status", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_cases_entityType_entityId_idx" ON "moderation_cases"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_featured_order_idx" ON "events"("featured", "order");

-- CreateIndex
CREATE UNIQUE INDEX "event_editions_slug_key" ON "event_editions"("slug");

-- CreateIndex
CREATE INDEX "event_editions_status_startsAt_idx" ON "event_editions"("status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_editions_eventId_year_key" ON "event_editions"("eventId", "year");

-- CreateIndex
CREATE INDEX "ticket_tiers_editionId_active_idx" ON "ticket_tiers"("editionId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_tiers_editionId_slug_key" ON "ticket_tiers"("editionId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_code_key" ON "registrations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_qrCodePayload_key" ON "registrations"("qrCodePayload");

-- CreateIndex
CREATE INDEX "registrations_editionId_status_idx" ON "registrations"("editionId", "status");

-- CreateIndex
CREATE INDEX "registrations_userId_idx" ON "registrations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders"("idempotencyKey");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_buyerEmail_idx" ON "orders"("buyerEmail");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_code_key" ON "payments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerPaymentId_key" ON "payments"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_orderId_status_idx" ON "payments"("orderId", "status");

-- CreateIndex
CREATE INDEX "payments_provider_status_idx" ON "payments"("provider", "status");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "payment_attempts_paymentId_createdAt_idx" ON "payment_attempts"("paymentId", "createdAt");

-- CreateIndex
CREATE INDEX "refunds_paymentId_status_idx" ON "refunds"("paymentId", "status");

-- CreateIndex
CREATE INDEX "ledger_entries_account_occurredAt_idx" ON "ledger_entries"("account", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "donations_churchId_createdAt_idx" ON "donations"("churchId", "createdAt");

-- CreateIndex
CREATE INDEX "webhook_events_processedAt_idx" ON "webhook_events"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_externalId_key" ON "webhook_events"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "media_submissions_code_key" ON "media_submissions"("code");

-- CreateIndex
CREATE INDEX "media_submissions_status_createdAt_idx" ON "media_submissions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "media_submissions_submitterId_createdAt_idx" ON "media_submissions"("submitterId", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_status_createdAt_idx" ON "media_assets"("status", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_perceptualHash_idx" ON "media_assets"("perceptualHash");

-- CreateIndex
CREATE UNIQUE INDEX "galleries_slug_key" ON "galleries"("slug");

-- CreateIndex
CREATE INDEX "galleries_editionId_year_idx" ON "galleries"("editionId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_items_galleryId_assetId_key" ON "gallery_items"("galleryId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "verses_rotationIndex_key" ON "verses"("rotationIndex");

-- CreateIndex
CREATE INDEX "verses_active_rotationIndex_idx" ON "verses"("active", "rotationIndex");

-- CreateIndex
CREATE UNIQUE INDEX "daily_verses_localDate_key" ON "daily_verses"("localDate");

-- CreateIndex
CREATE INDEX "daily_verses_localDate_idx" ON "daily_verses"("localDate");

-- CreateIndex
CREATE INDEX "hero_slides_active_order_idx" ON "hero_slides"("active", "order");

-- CreateIndex
CREATE UNIQUE INDEX "announcements_slug_key" ON "announcements"("slug");

-- CreateIndex
CREATE INDEX "announcements_publishedAt_idx" ON "announcements"("publishedAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "stat_counters_key_key" ON "stat_counters"("key");

-- CreateIndex
CREATE INDEX "stat_snapshots_counterId_takenAt_idx" ON "stat_snapshots"("counterId", "takenAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "job_runs_jobKey_startedAt_idx" ON "job_runs"("jobKey", "startedAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_homeChurchId_fkey" FOREIGN KEY ("homeChurchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "churches" ADD CONSTRAINT "churches_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_schedules" ADD CONSTRAINT "service_schedules_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_occurrences" ADD CONSTRAINT "service_occurrences_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "service_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_occurrences" ADD CONSTRAINT "service_occurrences_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ministry_memberships" ADD CONSTRAINT "ministry_memberships_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ministry_memberships" ADD CONSTRAINT "ministry_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "service_occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in_tokens" ADD CONSTRAINT "check_in_tokens_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "service_occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_interactions" ADD CONSTRAINT "prayer_interactions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "prayer_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_interactions" ADD CONSTRAINT "prayer_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_replies" ADD CONSTRAINT "prayer_replies_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "prayer_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_replies" ADD CONSTRAINT "prayer_replies_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_prayerRequestId_fkey" FOREIGN KEY ("prayerRequestId") REFERENCES "prayer_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_editions" ADD CONSTRAINT "event_editions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_editions" ADD CONSTRAINT "event_editions_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_editions" ADD CONSTRAINT "event_editions_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_tiers" ADD CONSTRAINT "ticket_tiers_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "event_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "event_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "ticket_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "event_editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "ticket_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_submissions" ADD CONSTRAINT "media_submissions_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_submissions" ADD CONSTRAINT "media_submissions_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "event_editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_submissions" ADD CONSTRAINT "media_submissions_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_submissions" ADD CONSTRAINT "media_submissions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "media_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "event_editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_verses" ADD CONSTRAINT "daily_verses_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "verses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_snapshots" ADD CONSTRAINT "stat_snapshots_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "stat_counters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
