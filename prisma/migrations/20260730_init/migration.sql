-- StockAI v3.0 Enterprise — Initial Database Migration
-- Generated: 2026-07-30
-- Database: PostgreSQL (Neon serverless-compatible)
-- ORM: Prisma

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE "User" (
    "id"               TEXT NOT NULL,
    "fullName"         TEXT NOT NULL,
    "email"            TEXT NOT NULL,
    "passwordHash"     TEXT,
    "googleId"         TEXT,
    "avatar"           TEXT,
    "provider"         TEXT NOT NULL DEFAULT 'local',
    "role"             TEXT NOT NULL DEFAULT 'contributor',
    "status"           TEXT NOT NULL DEFAULT 'pending_activation',
    "activeDeviceId"   TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt"      TIMESTAMP(3),
    "totalGenerations" INTEGER NOT NULL DEFAULT 0,
    "totalPrompts"     INTEGER NOT NULL DEFAULT 0,
    "totalCsvExports"  INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- ─── Subscriptions ────────────────────────────────────────────────────────────

CREATE TABLE "Subscription" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "planId"       TEXT NOT NULL DEFAULT 'plan_free',
    "planName"     TEXT NOT NULL DEFAULT 'Free',
    "price"        INTEGER NOT NULL DEFAULT 0,
    "durationDays" INTEGER NOT NULL DEFAULT 0,
    "activatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive"     BOOLEAN NOT NULL DEFAULT false,
    "isExpired"    BOOLEAN NOT NULL DEFAULT true,
    "deviceId"     TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE INDEX "Subscription_isActive_idx" ON "Subscription"("isActive");
CREATE INDEX "Subscription_expiresAt_idx" ON "Subscription"("expiresAt");

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Sessions ─────────────────────────────────────────────────────────────────

CREATE TABLE "Session" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "deviceId"  TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Password Reset Tokens ────────────────────────────────────────────────────

CREATE TABLE "PasswordResetToken" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used"      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Audit Logs ───────────────────────────────────────────────────────────────

CREATE TABLE "AuditLog" (
    "id"           TEXT NOT NULL,
    "adminEmail"   TEXT NOT NULL,
    "action"       TEXT NOT NULL,
    "targetUser"   TEXT NOT NULL,
    "details"      TEXT NOT NULL,
    "adminUserId"  TEXT,
    "targetUserId" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_adminEmail_idx" ON "AuditLog"("adminEmail");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- ─── System API Keys ──────────────────────────────────────────────────────────

CREATE TABLE "SystemApiKey" (
    "id"                TEXT NOT NULL,
    "provider"          TEXT NOT NULL,
    "label"             TEXT NOT NULL,
    "encryptedKey"      TEXT NOT NULL,
    "isEnabled"         BOOLEAN NOT NULL DEFAULT true,
    "isHealthy"         BOOLEAN NOT NULL DEFAULT true,
    "selectionStrategy" TEXT NOT NULL DEFAULT 'health-based',
    "source"            TEXT NOT NULL DEFAULT 'admin',
    "addedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt"        TIMESTAMP(3),
    "lastSuccessAt"     TIMESTAMP(3),
    "lastFailureAt"     TIMESTAMP(3),
    "successCount"      INTEGER NOT NULL DEFAULT 0,
    "failureCount"      INTEGER NOT NULL DEFAULT 0,
    "totalRequests"     INTEGER NOT NULL DEFAULT 0,
    "avgLatencyMs"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consecutiveFails"  INTEGER NOT NULL DEFAULT 0,
    "cooldownUntil"     BIGINT NOT NULL DEFAULT 0,
    "rateLimitUntil"    BIGINT NOT NULL DEFAULT 0,
    "quotaStatus"       TEXT NOT NULL DEFAULT 'ok',
    "rateLimitStatus"   TEXT NOT NULL DEFAULT 'ok',
    "timeoutCount"      INTEGER NOT NULL DEFAULT 0,
    "rateLimitCount"    INTEGER NOT NULL DEFAULT 0,
    "lastErrorMessage"  TEXT,
    "healthScore"       INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT "SystemApiKey_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SystemApiKey_provider_idx" ON "SystemApiKey"("provider");
CREATE INDEX "SystemApiKey_isEnabled_isHealthy_idx" ON "SystemApiKey"("isEnabled", "isHealthy");
CREATE INDEX "SystemApiKey_provider_isEnabled_idx" ON "SystemApiKey"("provider", "isEnabled");

-- ─── AI Telemetry ─────────────────────────────────────────────────────────────

CREATE TABLE "TelemetryLog" (
    "id"             TEXT NOT NULL,
    "requestId"      TEXT NOT NULL,
    "userId"         TEXT,
    "provider"       TEXT NOT NULL,
    "model"          TEXT NOT NULL,
    "responseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "success"        BOOLEAN NOT NULL,
    "cacheHit"       BOOLEAN NOT NULL DEFAULT false,
    "retries"        INTEGER NOT NULL DEFAULT 0,
    "fallbacks"      INTEGER NOT NULL DEFAULT 0,
    "errorType"      TEXT,
    "errorMessage"   TEXT,
    "platform"       TEXT,
    "fileName"       TEXT,
    "fileType"       TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelemetryLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TelemetryLog_requestId_key" ON "TelemetryLog"("requestId");
CREATE INDEX "TelemetryLog_createdAt_idx" ON "TelemetryLog"("createdAt");
CREATE INDEX "TelemetryLog_userId_idx" ON "TelemetryLog"("userId");
CREATE INDEX "TelemetryLog_provider_idx" ON "TelemetryLog"("provider");
CREATE INDEX "TelemetryLog_success_idx" ON "TelemetryLog"("success");

-- ─── Prisma Migration Metadata ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) NOT NULL,
    "checksum"              VARCHAR(64) NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("id")
);
