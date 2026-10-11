# Каталог внешних интеграций: слоты, платежи, OAuth

Справочник для подключения боевых бэкендов (Части 2–4) к фронту Части 5. Фронтенд уже говорит
на их языке: `POST /launch` возвращает URL игры (модель лаунчера агрегатора), кошелёк держит
балансы на своей стороне (модель seamless wallet), а `/play/remote` открывает игру в iframe.

Важно про «найти ключи»: **ключи OAuth и доступы к агрегаторам/платёжкам не публикуются
в интернете и не могут быть найдены** — они выпускаются на конкретный аккаунт и домен после
верификации юрлица, а у игровых поставщиков ещё и после проверки лицензии. Ниже — где именно
выпускаются, что нужно ввести и какие env-имена ожидает этот репозиторий.

## 1. Слот-агрегаторы (один API вместо десятков студий)

| Агрегатор | Модель | Документация | Комментарий |
| --- | --- | --- | --- |
| SoftAggregator (softaggregator.com) | seamless wallet REST, 40 000+ игр, 200+ провайдеров | публичная, self-service, песочница в день обращения | самый быстрый вход: публичные доки, цена от ~8% GGR |
| SOFTSWISS Game Aggregator | seamless wallet, 300+ провайдеров | по договору | энтерпрайз, запуск ~3 недели, валидация интеграции их командой |
| EveryMatrix (SlotMatrix / Aggregation) | seamless wallet | по запросу | энтерпрайз + платформа целиком |
| Hub88 (Hub88.io) | seamless wallet | по запросу | средний сегмент |
| Slotegrator / APIgrator | агрегация + cabinet | по запросу | популярен в СНГ-ориентированных проектах |
| GR8 Tech, Alea, SoftGamings, NuxGame, Pariplay Fusion | seamless wallet | по запросу | альтернативы для тендера |

Прямые API студий (если агрегатор не нужен): **Pragmatic Play** (Seamless Wallet API: оператор
держит HTTP-колбэки `Authenticate`, списание/зачисление по каждой ставке; лаунчер возвращает URL
с одноразовым токеном), Play'n GO, Evoplay, BGaming, Push Gaming, Hacksaw, Relax (Silver Bullet),
Nolimit City. Схема везде одна и совпадает с нашим контрактом:

1. бэкенд оператора просит у агрегатора launch-URL игры, передав одноразовый токен игрока;
2. фронт открывает этот URL (`/play/remote`, iframe) — у нас уже так;
3. агрегатор дёргает колбэки кошелька оператора на каждую ставку/выигрыш (баланс живёт у нас —
   это ровно наш мультивалютный кошелёк без конвертации);
4. демо-режим агрегаторы отдают без сессии кошелька — наш «демо без авторизации» (§23).

Что просить у менеджера: тестовые ключи песочницы, список методов seamless wallet, формат
launch-URL и перечень юрисдикций/валют (наши RUB/UAH/BYN/KZT/UZS обычно поддерживаются фиатом
агрегатора, крипто-кошельки USDT TRC20/BTC остаются на стороне оператора).

## 2. Платёжные системы по валютам релиза

Конвертации между кошельками у нас нет (§2.5), поэтому под каждую валюту подбирается свой PSP;
в кассе методы одного гео никогда не смешиваются с другим (RU/UA раздельно — уже в UI).

| Валюта | PSP | Методы | Документация |
| --- | --- | --- | --- |
| RUB | ЮKassa | карты РФ, СБП, SberPay | yookassa.ru/developers/api |
| RUB | CloudPayments | карты, СБП, виджет | developers.cloudpayments.ru |
| RUB | Paydex | СБП от 1%, карты, USDT TRC20/BEP20 | paydex.pro |
| UAH | WayForPay | карты UA, приват24 | wayforpay.com (раздел Developers) |
| UAH | Portmone / NovaPay | карты UA | по договору |
| BYN | bePaid | карты BY, ЕРИП | docs.bePaid.com |
| BYN | WebPay | карты BY, ЕРИП | webpay.by |
| KZT | Paybox (Paybox.kz) | карты KZ, Kaspi | paybox.kz (docs) |
| KZT | CloudPayments KZ | карты KZ | developers.cloudpayments.ru |
| UZS | Payme / Click Business | карты UZ, Humo/Uzcard | payme.uz/business, click.uz (merchant API) |
| USDT TRC20 | NOWPayments | инвойс, webhook подтверждения | document.nowpayments.io |
| USDT TRC20 | CryptoCloud | инвойс, float-адреса | docs.cryptocloud.plus |
| USDT TRC20 / BTC | BTCPay Server (self-hosted) | инвойс, webhook | docs.btcpayserver.org |
| BTC | NOWPayments / CryptoCloud / BTCPay | см. выше | см. выше |

Крипта: сеть всегда видна в UI (§2.5), зачисление — по факту подтверждения (наш polling статуса
платежа уже соответствует: статус тянется с PSP, а не выдумывается). Адрес валидируется маской
сети: USDT TRC20 `T[1-9A-HJ-NP-Za-km-z]{33}`, BTC `bc1…/1…/3…` — уже в формах.

Маппинг на наши `methodId` в кассе: `sbp` → ЮKassa/Paydex SBP, `card` → CloudPayments/bePaid/Paybox/Payme,
`usdt_trc20` → NOWPayments/CryptoCloud/BTCPay, `btc` → тот же крипто-шлюз. В мок-слое эти id уже
совпадают с контрактом кассы, боевой адаптер подставляется на стороне бэкенда.

## 3. Ключи регистрации OAuth (Google, Telegram)

Ключи выпускаются вручную на ваш аккаунт и домен; репозиторий читает их из env:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=...
```

Пока переменные пустые, кнопки входа работают в демо-режиме мока; когда значения появляются,
`OAuthButtons` рисует настоящие виджеты провайдеров и отправляет их credential
в `POST /api/v1/auth/oauth` — проверку подписи делает бэкенд (Части 2–4).

### Google

1. console.cloud.google.com → APIs & Services → Credentials → Create Credentials → OAuth client ID.
2. Тип **Web application**; в Authorized JavaScript origins добавить боевой домен
   (`https://depkasino.dev`), в Authorized redirect URIs — URI колбэка бэкенда
   (`https://<домен>/api/v1/auth/oauth/google/callback`), если используется code-flow.
3. Скопировать Client ID (вида `123…-abc….apps.googleusercontent.com`) в
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; Client Secret — только в секреты бэкенда (не в NEXT_PUBLIC!).
4. Экран согласия: заполнить название и support-email, скоупы для входа: `openid email profile`.

Фронт использует Google Identity Services (кнопка рендерится самим Google), credential — JWT,
который бэкенд проверяет по подписи Google; секрет для этого не нужен.

### Telegram

1. В Telegram: @BotFather → `/newbot` → получить username и bot token.
2. Там же: Bot Settings → **Domain** → указать боевой домен без схемы (`depkasino.dev`) —
   виджет работает только с привязанным доменом.
3. Username бота положить в `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`; bot token — только в секреты
   бэкенда: им проверяется `hash` из ответа виджета (HMAC-SHA256 от data-строк на ключе,
   производном от bot token).
4. Альтернатива для мини-аппов: Telegram OpenID Connect (`https://app{id}-login.tg.dev`) — тот же
   принцип, id_token проверяется по ключам Telegram.

Виджет на фронте уже подключён (`telegram-widget.js?22`, тёмная тема интерфейса не конфликтует:
виджет рисуется в своей рамке), колбэк `onTelegramAuth(user)` передаёт объект с `hash` в наш
`/auth/oauth`.

## 4. Порядок боевого подключения (чек-лист)

1. Юрлицо и лицензия/партнёрское письмо → договор с агрегатором слотов и PSP по гео.
2. Выпустить ключи песочниц: агрегатор, PSP каждой валюты, Google, Telegram.
3. Бэкенд (Части 2–4): реализовать колбэки seamless wallet и проверку OAuth-подписей;
   статус платежа — только из webhook/PSP-статуса, как требует наше зачисление «по факту».
4. Фронт: выставить `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_MODE=live`, ключи OAuth;
   обложки и логотипы придут с CDN агрегатора (next.image уже оптимизирует абсолютные URL).
5. Прогнать `npm run acceptance` и `npm run visual-smoke` против песочниц — они не зависят
   от мока и проверяют контракт поверх любого живого API.
