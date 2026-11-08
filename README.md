# Xlorella — панель продаж

Дашборд для теста рекламы сиропа хлореллы: реклама Meta, лиды из Direct, заказы, склад.
Next.js (App Router) + Supabase, деплой на Vercel. Языки: RU / EN / UZ, светлая и тёмная тема.

## Что уже есть

- Главная страница: описание, бутылка, инфографика, окно входа справа
- Вход: email + пароль и Google (через Supabase). Без ключей Supabase работает демо-режим
- База Supabase: лиды, заказы, склад, заметки, статистика рекламы, настройки + права по ролям
- Дашборд, вкладка **Сводка**: KPI, группы объявлений, график по дням, экономика заказа, чек-лист, креативы
- Вкладка **Лиды**: статусы, кольцевая диаграмма, таблица с поиском, смена статуса, добавление лида
- **Заказы**: оформление из лида, доставка и оплата, выручка
- **Склад**: остаток, приход, корректировки; при заказе бутылки списываются автоматически (триггер в базе)
- **Заметки**: общие и по лидам
- **Группы и креативы**: сравнение по CPM/CTR/CPA/ROAS + загрузка CSV из Ads Manager
- **Бюджет**: план и факт расхода, темп, настройки экономики (курс, цена, себестоимость)
- **Повторные**: клиенты с 2+ заказами

Без Supabase показываются **демо**-цифры (`lib/demo.ts`). С Supabase лиды берутся из базы, а статистика рекламы — из таблицы `ad_stats`.

## Запуск локально

```bash
npm install
cp .env.example .env.local   # можно оставить пустым — будет демо-режим
npm run dev
```

Открыть http://localhost:3000

## Подключение Supabase

1. supabase.com → New project (регион поближе, например Frankfurt)
2. SQL Editor → вставить весь файл `supabase/schema.sql` → Run
   (если база создавалась раньше — запустить ещё `supabase/002_orders_stock.sql`)
3. Project Settings → API → скопировать `Project URL` и `anon public` key
4. Добавить их в Vercel (Settings → Environment Variables) и в `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Redeploy
5. Authentication → Users → Add user (email + пароль) для себя
6. Table Editor → `profiles` → у своего пользователя поставить `role = admin`
7. Для входа через Google: Authentication → Providers → Google (нужен Client ID из Google Cloud),
   и Authentication → URL Configuration → добавить адрес сайта на Vercel

Роли: `admin` — всё, `manager` — только свои лиды и заказы, `owner` — только просмотр,
`pending` — новый пользователь без доступа (роль выдаёт админ).

## Деплой на Vercel

1. Залить репозиторий на GitHub
2. Vercel → Add New Project → выбрать репозиторий (Framework: Next.js)
3. В Environment Variables добавить `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` (когда будет Supabase)
4. Deploy

## Структура

```
app/
  page.tsx              главная + вход
  dashboard/page.tsx    дашборд (вкладки)
  globals.css           цвета тем, стекло, главная
  dashboard/dashboard.css
components/
  Bottle.tsx            бутылка (SVG)
  LoginCard.tsx         окно входа
  Providers.tsx         язык и тема
  dash/                 шапка, вкладки, графики
lib/
  i18n.ts               все тексты на 3 языках
  demo.ts               демо-данные
  metrics.ts            формулы CPM, CTR, CPA, ROAS и т.д.
```

## Дальше

- Экспорт в Excel/CSV, Telegram-уведомления
