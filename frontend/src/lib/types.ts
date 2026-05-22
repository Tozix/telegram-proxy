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
