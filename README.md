# Depkasino — веб-клиент казино (Часть 5 + Часть 5.1)

Публичный фронтенд онлайн-казино для СНГ: **mobile-first, только тёмная тема, ядро — слоты**.
Next.js 14 App Router · TypeScript strict · Tailwind · TanStack Query (server state) · Zustand (auth/wallet/ui/geo) ·
React Hook Form + Zod · Axios. WebSocket/Socket.IO не подключаются: баланс обновляется polling-ом и refetch-ем по фокусу.

> Бэкенда (Части 2–4) в репозитории нет, поэтому по умолчанию приложение работает на встроенном
> мок-слое `src/mocks/*` + `/api/v1/[...path]`, который повторяет контракты Частей 2–4.

## Запуск

```bash
npm install                 # из корня: это npm workspaces (apps/*)
npm run dev                 # http://localhost:3000 — сервер слушает 0.0.0.0
npm run build && npm start  # прод-сборка
npm run typecheck           # tsc --noEmit
npm run lint                # next lint
npm run acceptance          # приёмка: деньги, API-сценарии, страницы, запреты §24 (нужен запущенный сервер)
```

`npm run acceptance` — 91 проверка по Части 5 и 5.1: исполняемая спецификация денежных форматов (§2.5),
полный денежный путь через API, обязательные блоки страниц и скан запретов §24. Скрипт идемпотентен:
сам сбрасывает демо-состояние, поэтому его можно гонять после каждой правки.

## Режимы API

| Переменная | Значение | Что происходит |
| --- | --- | --- |
| `NEXT_PUBLIC_API_MODE` | `mock` (по умолчанию) | данные из `src/mocks`, роут `/api/v1/[...path]` |
| `NEXT_PUBLIC_API_MODE` | `live` | реальные запросы на `NEXT_PUBLIC_API_URL` |

Скопируйте `apps/web/.env.example` в `apps/web/.env.local`, если нужен `live`-режим.

## Что реализовано

- **Витрина.** Главная отдаётся из SSR (герой, колода, популярное, новые, провайдеры), каталог и карточка игры — тоже.
  Приватные разделы (`/wallet`, `/profile`, `/history`, `/kyc`, `/support`, `/referral`, `/favorites`) — под `Protected`
  и с `noindex`.
- **Колода дня (GameDeck).** Стек 1+2 на телефоне и 1+3 на десктопе, очередь из 4 мини-тюмбов, свайпы влево/вправо,
  «Играть» только на фронт-карте, драг вверх отдан скроллу, при `prefers-reduced-motion` — кроссфейд.
- **Запуск игры.** Гость → `LoginSheet`, после входа запуск продолжается. Проверки по кошелькам: последняя игранная валюта →
  активная → другая ненулевая (с вопросом «В ₽ пусто. Играть с 8 200 ₸?») → валюта не поддерживается → депозит.
  Игровые экраны: `/play` (мок-поле), `/play/remote` (iframe провайдера), `/play/error?code=` (7 кодов).
- **Аккаунт.** Регистрация/вход, OAuth (Google, Telegram), verify-email, forgot/reset, профиль (Данные/Безопасность/
  Сессии/Настройки), KYC (6 состояний), тикеты поддержки, реферальный кабинет.
- **Деньги.** Мультивалютный кошелёк `RUB · UAH · BYN · KZT · UZS · USDT TRC20 · BTC` с отдельными балансами,
  касса `DepositSheet` (один экран) и `WithdrawSheet` (проверки KYC → пустой кошелёк → метод той же валюты → `ConfirmModal`),
  история транзакций и ставок. Конвертации нет нигде.

Полная карта проверки — `docs/чек-лист-приёмки.md`.

## Структура

```
apps/web/src
├── app            # (auth) и (main) группы, play-роуты, api/v1/[...path]
├── components     # ui · layout · auth · casino · game · wallet · profile · kyc · support · referral · shared
├── hooks          # useLaunch, usePayments, useWalletData, useMounted, useMediaQuery …
├── lib            # api/* (9 доменов), data/catalog.ts (SSR), format.ts (деньги), session-hint.ts
├── mocks          # сервер, каталог, гео, платёжные методы, состояние демо-аккаунта
├── stores         # geo · auth · wallet · ui · toast · launch
├── constants      # CURRENCY_ASSETS, FEATURE_FLAGS (все false), STORAGE_KEYS
└── types          # типы Части 5
```

## Демо-помощники мок-API

```bash
curl -X POST localhost:3000/api/v1/dev/reset                       # вернуть состояние демо-аккаунта
curl -X POST localhost:3000/api/v1/dev/kyc -d '{"status":"rejected"}' -H 'Content-Type: application/json'
# status: not_started | pending | on_review | resubmit | rejected | approved
```

Демо-аккаунт: вход любым email/паролем ≥ 8 символов. Депозит зачисляется по факту платежа
(в моке — через 6–12 с), заявка KYC «одобряется» примерно через 15 с, чтобы вывод проходился целиком.
