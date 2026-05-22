import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Lightweight audit record of one incoming webhook delivery and its forwarding
 * to the real backend. Useful for debugging bots in production.
 */
@Entity({ name: 'delivery_logs' })
@Index(['botId', 'createdAt'])
export class DeliveryLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bot_id', type: 'uuid', nullable: true })
  botId!: string | null;

  @Column({ name: 'update_id', type: 'bigint', nullable: true })
  updateId!: string | null;

  @Column({ name: 'target_url' })
  targetUrl!: string;

  @Column({ name: 'request_bytes', type: 'int', default: 0 })
  requestBytes!: number;

  @Column({ name: 'response_status', type: 'int', nullable: true })
  responseStatus!: number | null;

  @Column({ default: false })
  success!: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'duration_ms', type: 'int', default: 0 })
  durationMs!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
