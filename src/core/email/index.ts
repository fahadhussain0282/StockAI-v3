/**
 * StockAI Enterprise Email Infrastructure
 *
 * Modular email system. Current implementation uses a stub provider
 * that logs emails to console. Swap `StubEmailProvider` for
 * ResendProvider / SendGridProvider / SMTPProvider when ready.
 *
 * Usage:
 *   await EmailService.sendWelcome({ to: 'user@example.com', name: 'John' });
 *   await EmailService.sendPlanActivation({ to: 'user@example.com', name: 'John', planName: '1 Month', expiresAt: '...' });
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface IEmailProvider {
  send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ── Templates ────────────────────────────────────────────────────────────────

export const EmailTemplates = {
  welcome(name: string): { subject: string; html: string; text: string } {
    return {
      subject: 'Welcome to StockAI — Enterprise Stock Metadata Engine',
      html: `
        <div style="font-family:Inter,sans-serif;background:#09090b;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;">
          <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Welcome to StockAI ✦</h1>
          <p style="color:#a1a1aa;">Hi ${name},</p>
          <p style="color:#a1a1aa;">Your StockAI account is ready. Upload your images to generate enterprise-grade metadata for Adobe Stock, Shutterstock, Freepik, and more.</p>
          <a href="${process.env.APP_URL || 'https://stockai.app'}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#fff;color:#000;border-radius:8px;font-weight:600;text-decoration:none;">Open StockAI →</a>
          <p style="color:#52525b;font-size:12px;margin-top:32px;">StockAI Enterprise — AI-Powered Stock Metadata</p>
        </div>`,
      text: `Welcome to StockAI, ${name}! Your account is ready. Visit ${process.env.APP_URL || 'https://stockai.app'} to get started.`
    };
  },

  planActivation(name: string, planName: string, expiresAt: string): { subject: string; html: string; text: string } {
    const expiry = new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return {
      subject: `StockAI — ${planName} Plan Activated`,
      html: `
        <div style="font-family:Inter,sans-serif;background:#09090b;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;">
          <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Plan Activated ✓</h1>
          <p style="color:#a1a1aa;">Hi ${name},</p>
          <p style="color:#a1a1aa;">Your <strong style="color:#fff;">${planName}</strong> plan is now active. You have full access to all StockAI features until <strong style="color:#fff;">${expiry}</strong>.</p>
          <a href="${process.env.APP_URL || 'https://stockai.app'}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#fff;color:#000;border-radius:8px;font-weight:600;text-decoration:none;">Generate Metadata →</a>
          <p style="color:#52525b;font-size:12px;margin-top:32px;">StockAI Enterprise — AI-Powered Stock Metadata</p>
        </div>`,
      text: `Hi ${name}, your ${planName} StockAI plan is active until ${expiry}.`
    };
  },

  planExpiryWarning(name: string, planName: string, daysRemaining: number, expiresAt: string): { subject: string; html: string; text: string } {
    const expiry = new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return {
      subject: `StockAI — Your ${planName} plan expires in ${daysRemaining} days`,
      html: `
        <div style="font-family:Inter,sans-serif;background:#09090b;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;">
          <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Plan Expiring Soon ⚠️</h1>
          <p style="color:#a1a1aa;">Hi ${name},</p>
          <p style="color:#a1a1aa;">Your <strong style="color:#fff;">${planName}</strong> plan expires on <strong style="color:#f59e0b;">${expiry}</strong> (${daysRemaining} days remaining).</p>
          <p style="color:#a1a1aa;">Renew now to avoid losing access to your metadata generation tools.</p>
          <a href="${process.env.APP_URL || 'https://stockai.app'}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#fff;color:#000;border-radius:8px;font-weight:600;text-decoration:none;">Renew Plan →</a>
          <p style="color:#52525b;font-size:12px;margin-top:32px;">StockAI Enterprise — AI-Powered Stock Metadata</p>
        </div>`,
      text: `Hi ${name}, your ${planName} StockAI plan expires in ${daysRemaining} days (${expiry}). Please renew.`
    };
  },

  adminAlert(subject: string, message: string): { subject: string; html: string; text: string } {
    return {
      subject: `[StockAI Admin] ${subject}`,
      html: `
        <div style="font-family:Inter,sans-serif;background:#09090b;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:12px;">
          <h1 style="font-size:20px;font-weight:700;color:#ef4444;margin-bottom:8px;">Admin Alert</h1>
          <p style="color:#a1a1aa;white-space:pre-wrap;">${message}</p>
          <p style="color:#52525b;font-size:12px;margin-top:32px;">StockAI Enterprise Admin — ${new Date().toISOString()}</p>
        </div>`,
      text: `[StockAI Admin Alert] ${subject}\n\n${message}`
    };
  }
};

// ── Stub Provider (logs to console — replace with real SMTP in production) ────

class StubEmailProvider implements IEmailProvider {
  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string }> {
    const msgId = `stub_${Date.now()}`;
    console.log(`\n[StockAI Email Stub] ──────────────────────────────────`);
    console.log(`  To:      ${message.to}`);
    console.log(`  Subject: ${message.subject}`);
    console.log(`  Body:    ${(message.text || '').substring(0, 120)}...`);
    console.log(`  MsgId:   ${msgId}`);
    console.log(`──────────────────────────────────────────────────────`);
    return { success: true, messageId: msgId };
  }
}

// ── Email Service ─────────────────────────────────────────────────────────────

class EmailServiceClass {
  private provider: IEmailProvider;
  private readonly DEFAULT_FROM = 'StockAI <noreply@stockai.app>';

  constructor(provider: IEmailProvider) {
    this.provider = provider;
  }

  /** Swap the provider at runtime (e.g., when Resend key is configured) */
  setProvider(provider: IEmailProvider): void {
    this.provider = provider;
  }

  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      return await this.provider.send({
        ...message,
        from: message.from || this.DEFAULT_FROM
      });
    } catch (err: any) {
      console.error('[StockAI Email] Send failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  async sendWelcome(opts: { to: string; name: string }): Promise<void> {
    const { subject, html, text } = EmailTemplates.welcome(opts.name);
    await this.send({ to: opts.to, subject, html, text });
  }

  async sendPlanActivation(opts: { to: string; name: string; planName: string; expiresAt: string }): Promise<void> {
    const { subject, html, text } = EmailTemplates.planActivation(opts.name, opts.planName, opts.expiresAt);
    await this.send({ to: opts.to, subject, html, text });
  }

  async sendPlanExpiryWarning(opts: { to: string; name: string; planName: string; daysRemaining: number; expiresAt: string }): Promise<void> {
    const { subject, html, text } = EmailTemplates.planExpiryWarning(opts.name, opts.planName, opts.daysRemaining, opts.expiresAt);
    await this.send({ to: opts.to, subject, html, text });
  }

  async sendAdminAlert(opts: { subject: string; message: string; adminEmails?: string[] }): Promise<void> {
    const recipients = opts.adminEmails || [process.env.ADMIN_EMAIL || 'adobeicon99@gmail.com'];
    const { subject, html, text } = EmailTemplates.adminAlert(opts.subject, opts.message);
    for (const to of recipients) {
      await this.send({ to, subject, html, text });
    }
  }
}

// Export singleton
export const EmailService = new EmailServiceClass(new StubEmailProvider());
