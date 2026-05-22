import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Sends transactional email over SMTP. If SMTP is not configured (no MAIL_HOST),
 * emails are skipped and the would-be link is logged — so registration still
 * works in local dev without a mail server.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    this.appUrl = config.get<string>('appUrl')!;
    const host = config.get<string>('mail.host')!;
    const fromAddr = config.get<string>('mail.from')!;
    const fromName = config.get<string>('mail.fromName')!;
    this.from = fromName && fromAddr ? `"${fromName}" <${fromAddr}>` : fromAddr;

    if (!host) {
      this.transporter = null;
      this.logger.warn('SMTP is not configured (MAIL_HOST empty) — emails will be logged, not sent');
      return;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: config.get<number>('mail.port'),
      secure: config.get<boolean>('mail.secure'),
      auth: { user: config.get<string>('mail.user'), pass: config.get<string>('mail.pass') },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/verify?token=${encodeURIComponent(token)}`;

    if (!this.transporter) {
      this.logger.warn(`[DEV] verification link for ${to}: ${link}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Подтверждение регистрации — Telegram Proxy',
      text: `Здравствуйте!\n\nПодтвердите ваш email, перейдя по ссылке:\n${link}\n\nЕсли вы не регистрировались, просто проигнорируйте это письмо.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
  <h2 style="color:#0f172a">Подтверждение регистрации</h2>
  <p style="color:#334155">Чтобы активировать аккаунт в Telegram Proxy, подтвердите email:</p>
  <p style="margin:24px 0">
    <a href="${link}" style="background:#2aabee;color:#06243a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Подтвердить email</a>
  </p>
  <p style="color:#64748b;font-size:13px">Или скопируйте ссылку: <br>${link}</p>
  <p style="color:#94a3b8;font-size:12px">Если вы не регистрировались — проигнорируйте это письмо.</p>
</div>`,
    });
    this.logger.log(`Verification email sent to ${to}`);
  }
}
