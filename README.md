# Telegram Proxy

> Self-hosted прозрачный прокси для Telegram-ботов: drop-in замена
> `api.telegram.org` и приём вебхуков для серверов вне зоны блокировки.

Решает проблему блокировки Telegram (например, в РФ): разверните прокси на
доступном извне сервере — и боты снова работают. Логика бота не меняется,
меняется только хост.

1. **Входящие вебхуки.** Telegram присылает апдейты на сервер с прокси,
   тот пересылает их на «реальный» бэкенд бота.
2. **Исходящий Bot API.** Бэкенд бота обращается к домену прокси вместо
   `api.telegram.org`, прокси прозрачно ходит в Telegram и возвращает ответ.
   API **полностью совместим** с Telegram Bot API — это drop-in замена хоста.

**Возможности:**
- 🔁 Прозрачный Bot API — любой метод и `content-type`, включая multipart и файлы
- 📥 Приём вебхуков с проверкой `secret_token` и пересылкой на ваш бэкенд
- ♻️ Повтор доставки вебхука до 3 раз, если бэкенд не ответил `2xx`
- 👥 Регистрация с подтверждением email; каждый пользователь управляет своими ботами
- 📊 Админ-дашборд со статистикой и графиками (пользователи, боты, доставки)
- 🛡️ Защита от open-relay (только зарегистрированные токены), кэш в Redis
- 🖥️ Веб-интерфейс (тёмная тема) + публичный лендинг с документацией
- 📚 Swagger / OpenAPI для админ-API

> Домены `proxy.example.com` и `your-backend.example.com` в примерах — плейсхолдеры,
> подставьте свои.

```
            updates                       forward
 Telegram ──────────▶  proxy.example.com  ──────────▶  бэкенд бота (РФ)
            (webhook)   /webhook/<secret>      (targetUrl)

 бэкенд бота (РФ) ──────────▶ proxy.example.com ──────────▶ api.telegram.org
   запросы Bot API           /bot<token>/<method>     прозрачный проксинг
```

## Стек

**Backend** ([`/`](.)):
- **NestJS 11** + TypeScript, рантайм и пакетный менеджер — **Bun** (TS исполняется напрямую, без сборки)
- **PostgreSQL** + **Prisma 7** (драйвер-адаптер `@prisma/adapter-pg`, без Rust-движка) —
  хранение ботов, токенов, журнала доставок, админов
- **Redis** (ioredis) — кэш «is token registered?» для open-relay-гарда прокси
  (общий для нескольких инстансов, переживает рестарт; БД остаётся источником истины)
- Авторизация админ-API — **JWT** (email + пароль)
- DTO на **class-validator / class-transformer**, ответы через `ClassSerializerInterceptor`
- Документация — **Swagger** (`/docs`) с примерами запросов/ответов

**Frontend** ([`/frontend`](frontend/)) — публичный лендинг, документация и веб-админка:
- **Next.js 15** (App Router) + **Tailwind CSS v4**, рантайм **Bun**
- Публичные страницы: лендинг (`/`) и документация с примерами кода (`/guide`)
- Админка (`/bots`, `/login`) — за авторизацией
- `output: 'standalone'` — свой Node-совместимый сервер
- Авторизация по схеме **BFF**: JWT хранится в `httpOnly`-cookie, браузер общается
  только с Next.js (CORS не нужен, токен в JS не попадает)

**Деплой** — единый **docker-compose** (postgres + redis + backend + frontend) за
reverse-proxy (nginx) с TLS.

## Содержание

- [Быстрый старт (Docker)](#быстрый-старт-docker)
- [Локальный запуск (Bun + Postgres/Redis на хост-машине)](#локальный-запуск-bun--postgresredis-на-хост-машине)
- [Веб-интерфейс](#веб-интерфейс)
- [Доступ в админку и администраторы](#доступ-в-админку-и-администраторы)
- [Деплой на сервере (Docker + nginx)](#деплой-на-сервере-docker--nginx)
- [Переменные окружения](#переменные-окружения)
- [Админ-API](#админ-api)
- [Как работает проксирование](#как-работает-проксирование)
- [Безопасность](#безопасность)
- [Прод-замечание про БД](#прод-замечание-про-бд)
- [Лицензия](#лицензия)

## Быстрый старт (Docker)

Поднимает всё разом: Postgres, Redis, backend и админку.

```bash
cp .env.example .env
# отредактируйте .env: JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, PUBLIC_BASE_URL, DB_PASSWORD
docker compose up -d --build
```

Поднимутся четыре сервиса:

| Сервис | URL | Назначение |
|---|---|---|
| `app` (backend) | `http://<host>:3000` | прокси + админ-API + Swagger `/docs` |
| `frontend` | `http://<host>:8080` | веб-админка (порт = `FRONTEND_PORT`) |
| `postgres` | — | БД (наружу не проброшена) |
| `redis` | — | кэш гарда прокси (наружу не проброшен) |

При первом запуске создаётся админ из `ADMIN_EMAIL`/`ADMIN_PASSWORD` (см.
[Доступ в админку](#доступ-в-админку-и-сид-администратора)). Откройте
**`http://<host>:8080`** и войдите этими данными.

Логи / остановка:
```bash
docker compose logs -f app          # логи backend
docker compose down                 # остановить
docker compose down -v              # остановить и стереть данные (pgdata, redisdata)
```

## Локальный запуск (Bun + Postgres/Redis на хост-машине)

Сценарий для разработки: **Postgres и Redis крутятся на хост-машине**, а backend и
frontend запускаются напрямую через Bun (с hot-reload).

### 1. Поднять Postgres и Redis на хосте

**Вариант А — отдельными docker-контейнерами** (быстрее всего, удобно в WSL):

```bash
docker run -d --name tp-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=telegram_proxy \
  -p 5432:5432 postgres:17-alpine

docker run -d --name tp-redis -p 6379:6379 redis:7-alpine
```

**Вариант Б — нативные пакеты** (Debian/Ubuntu/WSL):

```bash
sudo apt update && sudo apt install -y postgresql redis-server
sudo service postgresql start
sudo service redis-server start
# создать пользователя/базу (пароль для роли postgres задайте под свой .env):
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE telegram_proxy;"
```

> Создавать таблицы вручную не нужно — их накатит `prisma db push` (шаг 2). Нужна
> только сама БД (`telegram_proxy`).

Проверка, что сервисы живы:
```bash
pg_isready -h localhost -p 5432        # postgres
redis-cli -h localhost -p 6379 ping    # -> PONG
```

### 2. Backend

```bash
bun install            # ставит зависимости и генерирует Prisma Client (postinstall)
cp .env.example .env
```

Отредактируйте `.env` под локальные сервисы (значения по умолчанию из
`.env.example` уже подходят для контейнеров/нативной установки выше):

```ini
PUBLIC_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_proxy?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=local-dev-secret-change-me-0123456789   # ≥16 символов
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin12345
```

Накатите схему в БД (создаст таблицы; повторяйте после изменений `schema.prisma`):
```bash
bun run db:push
```

Запуск:
```bash
bun run start:dev      # hot-reload на http://localhost:3000
# или: bun run dev
```

Проверка:
```bash
curl http://localhost:3000/health           # {"status":"ok",...}
open http://localhost:3000/docs             # Swagger UI
```

### 3. Frontend (в отдельном терминале)

```bash
cd frontend
bun install
cp .env.example .env        # API_URL=http://localhost:3000, COOKIE_SECURE=false
bun run dev                 # http://localhost:3001
```

Откройте **http://localhost:3001** и войдите данными `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

### 4. Проверка типов

`bun run typecheck` — единственный рабочий чек (в корне **и** в `frontend/`).
ESLint/Prettier в проекте не настроены, их скрипты упадут.

## Веб-интерфейс

Фронтенд отдаёт публичные страницы и админку:

| Путь | Доступ | Назначение |
|---|---|---|
| `/` | публично | Лендинг с описанием возможностей |
| `/guide` | публично | Документация с примерами на Python / TypeScript / JavaScript |
| `/register`, `/login`, `/verify` | публично | Регистрация, вход, подтверждение email |
| `/bots` | по JWT | Свои боты (у пользователя — только свои) |
| `/dashboard`, `/users` | по JWT (админ) | Дашборд со статистикой и управление пользователями |

Домен прокси в примерах документации берётся из `NEXT_PUBLIC_PROXY_HOST`, ссылка на
Swagger — из `NEXT_PUBLIC_SWAGGER_URL` (см. [frontend/.env.example](frontend/.env.example)).

## Доступ в админку и администраторы

**Первый администратор создаётся автоматически.** При старте backend вызывает
`UsersService.ensureAdmin()`: если таблица `users` **пуста**, создаётся один админ
из переменных окружения:

| Переменная | По умолчанию |
|---|---|
| `ADMIN_EMAIL` | `admin@example.com` |
| `ADMIN_PASSWORD` | `admin12345` |

В логах при первом старте появится: `Seeded initial admin user: <email>`.

**Как войти:**
1. Откройте веб-админку (`http://localhost:3001` локально или `http://<host>:8080` /
   ваш домен в проде).
2. Введите `ADMIN_EMAIL` и `ADMIN_PASSWORD`.
3. После входа JWT кладётся в `httpOnly`-cookie `tp_token`; вы попадаете в `/bots`.

Либо через API напрямую — `POST /auth/login` (см. [Админ-API](#админ-api)).

> **Важно:** сид срабатывает только при пустой таблице `users`. Если вы поменяете
> `ADMIN_PASSWORD` в `.env` уже после первого старта, существующий админ **не**
> обновится.

**Добавить администратора / сбросить пароль** — скриптом `create-admin`
(идемпотентный: создаёт нового или меняет пароль существующему по email):

```bash
# локально (Bun):
bun run create-admin newadmin@example.com 'надёжный-пароль'

# в Docker:
docker compose exec app bun run create-admin newadmin@example.com 'надёжный-пароль'
```

Скрипту нужен только `DATABASE_URL` (берётся из `.env`). Так можно завести несколько
администраторов или сбросить забытый пароль, не трогая БД вручную.

**Управление администраторами из интерфейса.** В админке есть раздел
**Администраторы** (`/users`): добавить, сменить пароль, удалить. То же доступно
через REST (`/api/users`, см. Swagger). Защита: нельзя удалить себя или последнего
администратора.

## Деплой на сервере (Docker + nginx)

На сервере с публичным доменом (в примерах — `proxy.example.com`, подставьте свой).

### 1. Запустить стек

```bash
git clone <repo> telegram-proxy && cd telegram-proxy
cp .env.example .env
```

Заполните `.env` для прода:
```ini
NODE_ENV=production
PUBLIC_BASE_URL=https://proxy.example.com   # https обязателен для вебхуков Telegram
DB_PASSWORD=<надёжный-пароль>
JWT_SECRET=<openssl rand -hex 32>
ADMIN_EMAIL=<ваш-email>
ADMIN_PASSWORD=<надёжный-пароль>
COOKIE_SECURE=true                              # админка отдаётся по HTTPS
FRONTEND_PORT=8080
```

```bash
docker compose up -d --build
```

Backend слушает `127.0.0.1:3000`, админка — `127.0.0.1:8080` (порты на хосте; наружу
их закрывает фаервол, публичный трафик идёт только через nginx).

### 2. nginx + TLS

Готовый пример: [deploy/nginx.conf.example](deploy/nginx.conf.example). Он
терминирует TLS и маршрутизирует:

- `/bot<token>/…`, `/file/bot<token>/…` → backend (прокси Bot API, стриминг больших тел)
- `/webhook/…` → backend (входящие вебхуки)
- `/api/…`, `/auth`, `/docs`, `/health` → backend (админ-API и Swagger)
- всё остальное (`/`, `/login`, `/bots`, `/_next/…`) → frontend (админка)

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/telegram-proxy
sudo ln -s /etc/nginx/sites-available/telegram-proxy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d proxy.example.com     # выпустить сертификат
```

> `client_max_body_size` в конфиге должен быть **≥ `MAX_UPLOAD_MB`** (по умолчанию
> 60m ≥ 50), иначе крупные `sendPhoto`/`sendDocument` будут обрезаться.
> При HTTPS обязательно `COOKIE_SECURE=true`, иначе браузер не сохранит cookie входа.

### 3. Обновление

```bash
git pull
docker compose up -d --build
```

## Переменные окружения

См. [.env.example](.env.example). Ключевые:

| Переменная | Назначение |
|---|---|
| `PUBLIC_BASE_URL` | Публичный origin (например `https://proxy.example.com`). Из него строятся URL вебхуков. |
| `DATABASE_URL` | Строка подключения Prisma к PostgreSQL (`postgresql://user:pass@host:5432/db?schema=public`). Используется и приложением, и CLI (`prisma db push`). |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | **Только для docker-compose**: настраивают встроенный контейнер Postgres и собирают `DATABASE_URL` внутри compose. |
| `REDIS_URL` | Полный URL Redis (`redis://host:port/db`). Если задан — `REDIS_HOST/PORT/PASSWORD/DB` игнорируются. |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` / `REDIS_DB` | Подключение к Redis (если не задан `REDIS_URL`). |
| `REDIS_KEY_PREFIX` | Префикс всех ключей сервиса в Redis (по умолчанию `tgproxy:`). |
| `REDIS_TOKEN_CACHE_TTL` | TTL (сек) кэша «токен зарегистрирован?» для гарда прокси (по умолчанию 30). |
| `JWT_SECRET` | Секрет подписи JWT (≥16 символов). |
| `JWT_EXPIRES_IN` | Срок жизни токена (`7d`, `12h`, …). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Первый админ, создаётся при пустой таблице `users`. |
| `APP_URL` | Публичный origin веб-интерфейса (для ссылок в письмах). За nginx = домен прокси; локально `http://localhost:3001`. |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_SSL` | SMTP-сервер для писем подтверждения. Пусто = письма не шлются, ссылка пишется в лог (dev). |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Учётные данные SMTP. |
| `MAIL_FROM` / `MAIL_FROM_NAME` | Адрес и имя отправителя. |
| `PROXY_ALLOW_UNREGISTERED` | `false` — проксировать Bot API только для зарегистрированных токенов (защита от открытого прокси). |
| `PROXY_TIMEOUT_MS` | Таймаут запросов прозрачного прокси к Telegram. |
| `WEBHOOK_FORWARD_TIMEOUT_MS` | Таймаут пересылки входящего вебхука на бэкенд бота. |
| `WEBHOOK_RETRY_ATTEMPTS` | Сколько раз повторно отправить вебхук, если бэкенд не вернул 2xx (по умолчанию 3). |
| `WEBHOOK_RETRY_DELAY_MS` | Базовая пауза между повторами (мс), растёт экспоненциально (по умолчанию 500). |
| `MAX_UPLOAD_MB` | Лимит размера тела запроса прокси (загрузка файлов). |
| `FRONTEND_PORT` | Хост-порт веб-админки в docker-compose (по умолчанию `8080`). |
| `COOKIE_SECURE` | `true` — только когда админка отдаётся по HTTPS (иначе cookie не сохранится по HTTP). |

> Redis **не обязателен для запуска**: если он недоступен, гард прокси прозрачно
> деградирует к запросу в БД (источник истины), сервис продолжает работать.

Переменные фронтенда — в [frontend/.env.example](frontend/.env.example): `API_URL`
(адрес backend, который видит только сервер Next.js), `PORT`, `COOKIE_SECURE`.

## Админ-API

Документация и интерактивная консоль: **`/docs`**.

1. **Логин** — получить JWT:
   ```bash
   curl -X POST https://proxy.example.com/auth/login \
     -H 'content-type: application/json' \
     -d '{"email":"admin@example.com","password":"admin12345"}'
   ```
   Ответ: `{ "accessToken": "...", "tokenType": "Bearer", "expiresIn": 604800 }`

2. **Создать бота** (валидирует токен через `getMe` и сразу ставит вебхук в Telegram):
   ```bash
   curl -X POST https://proxy.example.com/api/bots \
     -H "authorization: Bearer $TOKEN" \
     -H 'content-type: application/json' \
     -d '{
       "name": "Support Bot",
       "token": "123456789:AA...",
       "targetWebhookUrl": "https://your-backend.example.com/telegram/webhook"
     }'
   ```

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/auth/register` | Регистрация (роль `user`) + письмо подтверждения |
| `POST` | `/auth/verify` | Подтверждение email по токену |
| `POST` | `/auth/resend` | Повторная отправка письма подтверждения |
| `POST` | `/auth/login` | Логин, выдаёт JWT (нужен подтверждённый email) |
| `GET` | `/auth/me` | Текущий пользователь |
| `GET` | `/api/stats` | Сводная статистика для дашборда (**только админ**) |
| `GET` | `/api/users` | Список пользователей (**только админ**) |
| `POST` | `/api/users` | Добавить администратора (**только админ**) |
| `PATCH` | `/api/users/:id` | Сменить пароль/email (**только админ**) |
| `DELETE` | `/api/users/:id` | Удалить пользователя (не себя/не последнего админа) |
| `POST` | `/api/bots` | Создать бота + setWebhook |
| `GET` | `/api/bots` | Список ботов (limit/offset) |
| `GET` | `/api/bots/:id` | Бот по id |
| `PATCH` | `/api/bots/:id` | Изменить (при смене URL/токена — переустанавливает вебхук) |
| `DELETE` | `/api/bots/:id` | Удалить бота + deleteWebhook |
| `POST` | `/api/bots/:id/refresh-webhook` | Переустановить вебхук |
| `GET` | `/api/bots/:id/webhook-info` | Живой `getWebhookInfo` из Telegram |
| `GET` | `/api/bots/:id/logs` | Журнал доставок вебхуков (limit/offset) |
| `GET` | `/health` | Liveness-проба |

Списочные методы (`/api/bots`, `/api/bots/:id/logs`) принимают `?limit=20&offset=0`
(limit 1–100, offset ≥ 0). Ответ: `{ "total", "limit", "offset", "items": [...] }`,
где `total` — общее число записей.

## Как работает проксирование

### Входящие вебхуки

- При создании/изменении бота сервис вызывает `setWebhook` с
  `url = {PUBLIC_BASE_URL}/webhook/<secret>` и `secret_token = <secret>`.
- Telegram шлёт апдейты на `POST /webhook/<secret>`. Мы проверяем заголовок
  `X-Telegram-Bot-Api-Secret-Token`, затем пересылаем тело **как есть** на
  `targetWebhookUrl` бота, добавляя тот же заголовок — бэкенд может проверять его
  ровно так же, как если бы Telegram звонил напрямую.
- Ответ бэкенда **прозрачно возвращается** Telegram — поэтому работает приём
  «ответ методом в теле ответа на вебхук». Ошибки/таймауты бэкенда логируются (в
  таблицу `delivery_logs`), а Telegram получает `200`, чтобы не было шторма ретраев
  (4xx сохраняется, 5xx превращается в 200).
- **Повторная отправка.** Если бэкенд не вернул `2xx` (или запрос упал/таймаут),
  доставка повторяется до `WEBHOOK_RETRY_ATTEMPTS` раз (по умолчанию 3) с
  экспоненциальной паузой (`WEBHOOK_RETRY_DELAY_MS`: 500мс → 1с → 2с). Каждая
  попытка пишется в `delivery_logs` с номером (`attempt`). При первом `2xx` ответ
  сразу прокидывается в Telegram; если все попытки неудачны — Telegram получает `200`.

### Исходящий Bot API (drop-in замена хоста)

Поменяйте в бэкенде бота базовый URL c `https://api.telegram.org` на
`https://proxy.example.com`:

```
https://proxy.example.com/bot<token>/sendMessage
https://proxy.example.com/file/bot<token>/<file_path>   # скачивание файлов
```

Проксируются **все** методы и любой `content-type`, включая
`multipart/form-data` (загрузка фото/документов). По умолчанию проксируются
только токены ботов, зарегистрированных в админке
(`PROXY_ALLOW_UNREGISTERED=false`). Проверка регистрации токена кэшируется в Redis
на `REDIS_TOKEN_CACHE_TTL` секунд (при недоступности Redis — запрос в БД).

## Безопасность

- Токены ботов хранятся в БД в открытом виде (нужны для вызова Telegram) —
  держите БД в приватной сети, ограничьте доступ.
- Смените `JWT_SECRET` и `ADMIN_PASSWORD` перед продом.
- Терминируйте TLS на reverse-proxy (nginx/Caddy/Traefik) перед сервисом;
  Telegram требует HTTPS для вебхуков. См. [deploy/nginx.conf.example](deploy/nginx.conf.example).
- Не пробрасывайте порты Postgres/Redis наружу; публичный трафик — только через nginx.

## Прод-замечание про БД

Схема накатывается через `prisma db push` (без файлов-миграций) — удобно для старта.
В docker-образе `db push` выполняется при старте контейнера (идемпотентно). Для
долгоживущей боевой БД имеет смысл перейти на версионируемые миграции
(`prisma migrate`), чтобы безопасно эволюционировать схему без потери данных.

> Prisma 7 использует драйвер-адаптер `@prisma/adapter-pg` (без Rust-движка), а
> сгенерированный клиент лежит в `generated/` (git-ignored, создаётся `prisma generate`
> на `postinstall`). Строка подключения для CLI берётся из [prisma.config.ts](prisma.config.ts).

## Лицензия

MIT — см. [LICENSE](LICENSE). Используйте, форкайте и разворачивайте свободно.
