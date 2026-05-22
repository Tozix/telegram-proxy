# Telegram Proxy

Прозрачный прокси для Telegram-ботов, развёрнутый на зарубежном сервере
(домен **telegram.crossmark.ru**). Решает проблему блокировки Telegram в РФ:

1. **Входящие вебхуки.** Telegram присылает апдейты на наш зарубежный сервер,
   мы пересылаем их на «реальный» бэкенд бота (в РФ).
2. **Исходящий Bot API.** Бэкенд бота обращается к нашему домену вместо
   `api.telegram.org`, а мы прозрачно проксируем запрос в Telegram и возвращаем
   ответ. API **полностью совместим** с Telegram Bot API — это drop-in замена
   хоста.

```
            updates                       forward
 Telegram ──────────▶  telegram.crossmark.ru  ──────────▶  бэкенд бота (РФ)
            (webhook)   /webhook/<secret>      (targetUrl)

 бэкенд бота (РФ) ──────────▶ telegram.crossmark.ru ──────────▶ api.telegram.org
   запросы Bot API           /bot<token>/<method>     прозрачный проксинг
```

## Стек

**Backend** ([`/`](.)):
- **NestJS 11** + TypeScript, рантайм и пакетный менеджер — **Bun** (TS исполняется напрямую, без сборки)
- **PostgreSQL** + TypeORM
- Авторизация админ-API — **JWT** (email + пароль)
- DTO на **class-validator / class-transformer**, ответы через `ClassSerializerInterceptor`
- Документация — **Swagger** (`/docs`) с примерами запросов/ответов

**Frontend** ([`/frontend`](frontend/)) — веб-админка:
- **Next.js 15** (App Router) + **Tailwind CSS v4**, рантайм **Bun**
- `output: 'standalone'` — свой Node-совместимый сервер, **без nginx**
- Авторизация по схеме **BFF**: JWT хранится в `httpOnly`-cookie, браузер общается
  только с Next.js (CORS не нужен, токен в JS не попадает)

**Деплой** — единый **docker-compose** (postgres + backend + frontend).

## Быстрый старт (Docker)

```bash
cp .env.example .env
# отредактируйте .env: JWT_SECRET, ADMIN_*, PUBLIC_BASE_URL, DB_PASSWORD
docker compose up -d --build
```

Поднимутся три сервиса:

| Сервис | URL | Назначение |
|---|---|---|
| `app` (backend) | `http://<host>:3000` | прокси + админ-API + Swagger `/docs` |
| `frontend` | `http://<host>:8080` | веб-админка (порт = `FRONTEND_PORT`) |
| `postgres` | — | БД (без проброса наружу) |

При первом запуске создаётся админ из `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Зайдите на
**`http://<host>:8080`** и войдите этими данными.

## Быстрый старт (локально, Bun)

Backend:
```bash
bun install
cp .env.example .env          # укажите доступ к локальному Postgres
bun run start:dev             # hot-reload на :3000
```

Frontend (в отдельном терминале):
```bash
cd frontend
bun install
cp .env.example .env          # API_URL=http://localhost:3000
bun run dev                   # :3001
```

Проверка типов: `bun run typecheck` (в каждом из каталогов).

## Переменные окружения

См. [.env.example](.env.example). Ключевые:

| Переменная | Назначение |
|---|---|
| `PUBLIC_BASE_URL` | Публичный origin (например `https://telegram.crossmark.ru`). Из него строятся URL вебхуков. |
| `DB_*` | Подключение к PostgreSQL. `DB_SYNCHRONIZE=true` авто-создаёт таблицы (для прод — переключите на миграции). |
| `JWT_SECRET` | Секрет подписи JWT (≥16 символов). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Первый админ, создаётся при пустой таблице users. |
| `PROXY_ALLOW_UNREGISTERED` | `false` — проксировать Bot API только для зарегистрированных токенов (защита от открытого прокси). |
| `MAX_UPLOAD_MB` | Лимит размера тела запроса прокси (загрузка файлов). |
| `FRONTEND_PORT` | Хост-порт веб-админки (по умолчанию `8080`). |
| `COOKIE_SECURE` | `true` — только когда админка отдаётся по HTTPS (иначе cookie не сохранится по HTTP). |

Переменные фронтенда — в [frontend/.env.example](frontend/.env.example): `API_URL`
(адрес backend, который видит только сервер Next.js), `PORT`, `COOKIE_SECURE`.

## Админка (веб-интерфейс)

Next.js-приложение в [frontend/](frontend/). Возможности: вход по JWT, список ботов,
создание/редактирование/удаление бота, переустановка вебхука, живой `getWebhookInfo`
из Telegram и журнал доставок вебхуков.

Архитектура — **BFF**: формы вызывают Server Actions, те ходят в backend с токеном из
`httpOnly`-cookie и сами рендерят страницы. Браузер никогда не держит JWT и не обращается
к backend напрямую — поэтому нужен только один публичный порт и не нужен CORS.

## Админ-API

Документация и интерактивная консоль: **`/docs`**.

1. **Логин** — получить JWT:
   ```bash
   curl -X POST https://telegram.crossmark.ru/auth/login \
     -H 'content-type: application/json' \
     -d '{"email":"admin@example.com","password":"admin12345"}'
   ```
   Ответ: `{ "accessToken": "...", "tokenType": "Bearer", "expiresIn": 604800 }`

2. **Создать бота** (валидирует токен через `getMe` и сразу ставит вебхук в Telegram):
   ```bash
   curl -X POST https://telegram.crossmark.ru/api/bots \
     -H "authorization: Bearer $TOKEN" \
     -H 'content-type: application/json' \
     -d '{
       "name": "Support Bot",
       "token": "123456789:AA...",
       "targetWebhookUrl": "https://my-backend.ru/telegram/webhook"
     }'
   ```

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/auth/login` | Логин, выдаёт JWT |
| `GET` | `/auth/me` | Текущий пользователь |
| `POST` | `/api/bots` | Создать бота + setWebhook |
| `GET` | `/api/bots` | Список ботов |
| `GET` | `/api/bots/:id` | Бот по id |
| `PATCH` | `/api/bots/:id` | Изменить (при смене URL/токена — переустанавливает вебхук) |
| `DELETE` | `/api/bots/:id` | Удалить бота + deleteWebhook |
| `POST` | `/api/bots/:id/refresh-webhook` | Переустановить вебхук |
| `GET` | `/api/bots/:id/webhook-info` | Живой `getWebhookInfo` из Telegram |
| `GET` | `/api/bots/:id/logs` | Лог доставки вебхуков |
| `GET` | `/health` | Liveness-проба |

## Как работает проксирование

### Входящие вебхуки

- При создании/изменении бота сервис вызывает `setWebhook` с
  `url = {PUBLIC_BASE_URL}/webhook/<secret>` и `secret_token = <secret>`.
- Telegram шлёт апдейты на `POST /webhook/<secret>`. Мы проверяем заголовок
  `X-Telegram-Bot-Api-Secret-Token`, затем пересылаем тело **как есть** на
  `targetWebhookUrl` бота, добавляя тот же заголовок — бэкенд может проверять его
  ровно так же, как если бы Telegram звонил напрямую.
- Ответ бэкенда **прозрачно возвращается** Telegram — поэтому работает приём
  «ответ методом в теле ответа на вебхук». Ошибки/таймауты бэкенда логируются, а
  Telegram получает `200`, чтобы не было шторма ретраев.

### Исходящий Bot API (drop-in замена хоста)

Поменяйте в бэкенде бота базовый URL c `https://api.telegram.org` на
`https://telegram.crossmark.ru`:

```
https://telegram.crossmark.ru/bot<token>/sendMessage
https://telegram.crossmark.ru/file/bot<token>/<file_path>   # скачивание файлов
```

Проксируются **все** методы и любой `content-type`, включая
`multipart/form-data` (загрузка фото/документов). По умолчанию проксируются
только токены ботов, зарегистрированных в админке
(`PROXY_ALLOW_UNREGISTERED=false`).

## Безопасность

- Токены ботов хранятся в БД в открытом виде (нужны для вызова Telegram) —
  держите БД в приватной сети, ограничьте доступ.
- Смените `JWT_SECRET` и `ADMIN_PASSWORD` перед продом.
- Терминируйте TLS на reverse-proxy (nginx/Caddy/Traefik) перед сервисом;
  Telegram требует HTTPS для вебхуков.

## Прод-замечание про БД

`DB_SYNCHRONIZE=true` удобно для старта, но в продакшене переключитесь на
TypeORM-миграции, чтобы не терять/портить данные при изменении схемы.
