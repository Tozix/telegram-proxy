export interface Bot {
  id: string;
  name: string;
  username: string | null;
  telegramBotId: number | null;
  tokenPreview: string;
  webhookUrl: string;
  targetWebhookUrl: string;
  allowedUpdates: string[] | null;
  isActive: boolean;
  lastWebhookSetAt: string | null;
  webhookError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

export interface DeliveryLog {
  id: string;
  botId: string | null;
  updateId: string | null;
  targetUrl: string;
  requestBytes: number;
  responseStatus: number | null;
  success: boolean;
  errorMessage: string | null;
  durationMs: number;
  attempt: number;
  createdAt: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  users: { total: number; verified: number; admins: number };
  bots: { total: number; active: number; withErrors: number };
  deliveries: { total: number; success: number; failed: number; last24h: number };
  series: { date: string; total: number; success: number; failed: number }[];
  topBots: { id: string; name: string; deliveries: number }[];
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
