# Xlorella — панель продаж

Дашборд для теста рекламы сиропа хлореллы: реклама Meta, лиды из Direct, заказы, склад.
Next.js (App Router) + Supabase, деплой на Vercel. Языки: RU / EN / UZ, светлая и тёмная тема.

## Что уже есть

- Главная страница: описание, бутылка, инфографика, окно входа справа
- Вход: email + пароль и Google (через Supabase). Без ключей Supabase работает демо-режим
- Дашборд, вкладка **Сводка**: KPI, группы объявлений, график по дням, экономика заказа, чек-лист, креативы
- Вкладка **Лиды**: статусы, кольцевая диаграмма, таблица с поиском, смена статуса, добавление лида
- Остальные вкладки — заглушки (следующий шаг)

Все цифры сейчас **демо** (`lib/demo.ts`).

## Запуск локально

```bash
npm install
cp .env.example .env.local   # можно оставить пустым — будет демо-режим
npm run dev
```

Открыть http://localhost:3000

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

- Таблицы в Supabase (leads, orders, ad_stats, stock, notes) + роли admin / manager / owner
- Импорт CSV из Ads Manager
- Вкладки: Группы и креативы, Заказы, Бюджет, Склад, Повторные, Заметки
- Экспорт в Excel/CSV, Telegram-уведомления
