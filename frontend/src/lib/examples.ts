import type { CodeTab } from '@/components/CodeTabs';

const TOKEN = '123456789:AA...';

/** Исходящий Bot API — drop-in замена хоста api.telegram.org. */
export function outboundTabs(host: string): CodeTab[] {
  return [
    {
      id: 'py',
      label: 'Python',
      filename: 'send.py',
      code: `import requests

PROXY = "${host}"
TOKEN = "${TOKEN}"

# Вместо https://api.telegram.org обращаемся к прокси — метод тот же.
resp = requests.post(
    f"{PROXY}/bot{TOKEN}/sendMessage",
    json={"chat_id": 12345, "text": "Привет через прокси!"},
    timeout=30,
)
print(resp.json())

# aiogram 3.x:
#   from aiogram.client.telegram import TelegramAPIServer
#   from aiogram.client.session.aiohttp import AiohttpSession
#   session = AiohttpSession(api=TelegramAPIServer.from_base(PROXY))
#   bot = Bot(TOKEN, session=session)
#
# python-telegram-bot 20+:
#   ApplicationBuilder().token(TOKEN) \\
#       .base_url(f"{PROXY}/bot").base_file_url(f"{PROXY}/file/bot").build()`,
    },
    {
      id: 'ts',
      label: 'TypeScript',
      filename: 'bot.ts',
      code: `import { Bot } from "grammy";

const PROXY = "${host}";

// grammY: подменяем apiRoot — дальше весь код как обычно.
const bot = new Bot(process.env.BOT_TOKEN!, {
  client: { apiRoot: PROXY },
});

await bot.api.sendMessage(12345, "Привет через прокси!");

// Telegraf: new Telegraf(token, { telegram: { apiRoot: PROXY } })`,
    },
    {
      id: 'js',
      label: 'JavaScript',
      filename: 'send.mjs',
      code: `const PROXY = "${host}";
const TOKEN = "${TOKEN}";

// Любой метод Bot API — просто другой хост.
const res = await fetch(\`\${PROXY}/bot\${TOKEN}/sendMessage\`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ chat_id: 12345, text: "Привет через прокси!" }),
});
console.log(await res.json());

// node-telegram-bot-api:
//   new TelegramBot(TOKEN, { baseApiUrl: PROXY })`,
    },
  ];
}

/** Скачивание файлов через /file/bot<token>/<path>. */
export function filesTabs(host: string): CodeTab[] {
  return [
    {
      id: 'py',
      label: 'Python',
      filename: 'download.py',
      code: `# getFile -> file_path, затем скачиваем сам файл через /file/...
info = requests.get(
    f"${host}/bot{TOKEN}/getFile",
    params={"file_id": file_id},
).json()
path = info["result"]["file_path"]

content = requests.get(f"${host}/file/bot{TOKEN}/{path}").content
open("photo.jpg", "wb").write(content)`,
    },
    {
      id: 'ts',
      label: 'TypeScript / JS',
      filename: 'download.ts',
      code: `const info = await fetch(\`${host}/bot\${TOKEN}/getFile?file_id=\${fileId}\`)
  .then((r) => r.json());
const path = info.result.file_path;

const file = await fetch(\`${host}/file/bot\${TOKEN}/\${path}\`);
const bytes = new Uint8Array(await file.arrayBuffer());`,
    },
  ];
}

/** Приём входящих вебхуков на вашем бэкенде. */
export function webhookTabs(): CodeTab[] {
  return [
    {
      id: 'py',
      label: 'Python · FastAPI',
      filename: 'webhook.py',
      code: `from fastapi import FastAPI, Request, Header, HTTPException

# Тот же секрет, что показан в карточке бота в админке.
SECRET = "<webhook secret из админки>"
app = FastAPI()

@app.post("/telegram/webhook")
async def webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str = Header(default=""),
):
    # Прокси пробрасывает этот заголовок — проверяем, как от Telegram.
    if x_telegram_bot_api_secret_token != SECRET:
        raise HTTPException(status_code=403)

    update = await request.json()
    # ... ваша обработка апдейта ...

    # Верните 2xx. Иначе прокси повторит доставку (по умолчанию до 3 раз).
    return {"ok": True}`,
    },
    {
      id: 'ts',
      label: 'TypeScript · Express',
      filename: 'webhook.ts',
      code: `import express from "express";

const SECRET = "<webhook secret из админки>";
const app = express();
app.use(express.json());

app.post("/telegram/webhook", (req, res) => {
  if (req.header("x-telegram-bot-api-secret-token") !== SECRET) {
    return res.sendStatus(403);
  }
  const update = req.body;
  // ... ваша обработка ...

  // 2xx обязательно — иначе будет до 3 повторов доставки.
  res.sendStatus(200);
});

app.listen(8080);`,
    },
    {
      id: 'js',
      label: 'JavaScript · Express',
      filename: 'webhook.js',
      code: `const express = require("express");

const SECRET = "<webhook secret из админки>";
const app = express();
app.use(express.json());

app.post("/telegram/webhook", (req, res) => {
  if (req.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return res.sendStatus(403);
  }
  // ... обработка req.body ...
  res.sendStatus(200); // верните 2xx, иначе прокси повторит
});

app.listen(8080);`,
    },
  ];
}

/** Регистрация бота через админ-API (прокси сам вызовет setWebhook). */
export function registerBotSnippet(host: string): string {
  return `# 1) Логин — получить JWT
curl -X POST ${host}/auth/login \\
  -H 'content-type: application/json' \\
  -d '{"email":"admin@example.com","password":"<пароль>"}'

# 2) Зарегистрировать бота (прокси проверит токен и поставит вебхук)
curl -X POST ${host}/api/bots \\
  -H "authorization: Bearer $TOKEN" \\
  -H 'content-type: application/json' \\
  -d '{
    "name": "My Bot",
    "token": "${TOKEN}",
    "targetWebhookUrl": "https://your-backend.example.com/telegram/webhook"
  }'`;
}
