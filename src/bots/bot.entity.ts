import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * A registered Telegram bot whose webhook traffic this service proxies.
 *
 * Flow:
 *  - Telegram posts updates to  {publicBaseUrl}/webhook/{webhookSecret}
 *  - We verify the X-Telegram-Bot-Api-Secret-Token header == webhookSecret
 *  - We forward the raw update to {targetWebhookUrl} (the real backend in RU)
 */
@Entity({ name: 'bots' })
export class Bot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  /** Telegram bot token (`123456:ABC...`). Stored as-is — keep the DB private. */
  @Exclude({ toPlainOnly: true })
  @Index({ unique: true })
  @Column()
  token!: string;

  /** Numeric Telegram id of the bot (from getMe). */
  @Column({
    name: 'telegram_bot_id',
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (v: number | null) => v,
      from: (v: string | null) => (v == null ? null : Number(v)),
    },
  })
  telegramBotId!: number | null;

  /** @-username of the bot (from getMe). */
  @Column({ nullable: true })
  username!: string | null;

  /** Secret used both as the path segment and the Telegram secret_token header. */
  @Index({ unique: true })
  @Column({ name: 'webhook_secret' })
  webhookSecret!: string;

  /** Real backend URL that should receive forwarded updates. */
  @Column({ name: 'target_webhook_url' })
  targetWebhookUrl!: string;

  /** Optional Telegram `allowed_updates` list passed to setWebhook. */
  @Column({ name: 'allowed_updates', type: 'jsonb', nullable: true })
  allowedUpdates!: string[] | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  /** Outcome of the last setWebhook call against Telegram. */
  @Column({ name: 'last_webhook_set_at', type: 'timestamptz', nullable: true })
  lastWebhookSetAt!: Date | null;

  @Column({ name: 'webhook_error', type: 'text', nullable: true })
  webhookError!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
