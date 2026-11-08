-- Xlorella: схема базы.
-- Запустить один раз: Supabase -> SQL Editor -> вставить весь файл -> Run.

-- ========== Профили и роли ==========
-- admin  — всё видит и всё меняет
-- manager — видит и меняет только своих лидов/заказы
-- owner  — всё видит, ничего не меняет
-- pending — новый пользователь без доступа, пока admin не выдаст роль
--           (иначе любой, кто войдёт через Google, увидел бы данные)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'pending' check (role in ('admin', 'manager', 'owner', 'pending')),
  created_at timestamptz not null default now()
);

-- при регистрации пользователя автоматически создаём профиль (роль pending)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- роль текущего пользователя (используется в политиках)
create or replace function public.my_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ========== Статистика рекламы (из CSV Ads Manager) ==========
create table if not exists public.ad_stats (
  id bigserial primary key,
  day date not null,
  ad_set text not null check (ad_set in ('broad', 'healthy', 'plant')),
  creative int not null check (creative between 1 and 4),
  spend numeric(10, 2) not null default 0,       -- $
  impressions int not null default 0,
  clicks int not null default 0,
  dialogs int not null default 0,
  unique (day, ad_set, creative)
);

-- ========== Лиды ==========
create table if not exists public.leads (
  id bigserial primary key,
  status text not null default 'new' check (status in ('new', 'qualified', 'order', 'lost')),
  name text not null,
  phone text,
  city text,
  ad_set text check (ad_set in ('broad', 'healthy', 'plant')),
  creative int check (creative between 1 and 4),
  manager_id uuid references public.profiles (id) default auth.uid(),
  amount bigint not null default 0,              -- сум
  created_at timestamptz not null default now()
);

-- ========== Заказы ==========
create table if not exists public.orders (
  id bigserial primary key,
  lead_id bigint references public.leads (id) on delete set null,
  manager_id uuid references public.profiles (id) default auth.uid(),
  quantity int not null default 1,
  amount bigint not null default 0,              -- сум
  address text,
  delivery_status text not null default 'new'
    check (delivery_status in ('new', 'sent', 'delivered', 'returned')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid')),
  created_at timestamptz not null default now()
);

-- ========== Склад (движения: приход +, расход -) ==========
create table if not exists public.stock_moves (
  id bigserial primary key,
  quantity int not null,
  reason text not null default 'manual' check (reason in ('arrival', 'order', 'return', 'manual')),
  order_id bigint references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ========== Заметки ==========
create table if not exists public.notes (
  id bigserial primary key,
  author_id uuid references public.profiles (id) default auth.uid(),
  lead_id bigint references public.leads (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- ========== Настройки (одна строка) ==========
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  usd_rate numeric not null default 12800,       -- сум за $
  price bigint not null default 180000,
  cost bigint not null default 85000,
  delivery bigint not null default 18000,
  target_margin numeric not null default 0.25,
  total_budget numeric not null default 420,
  test_start date not null default current_date
);
insert into public.settings (id) values (1) on conflict do nothing;

-- ========== Права доступа (RLS) ==========
alter table public.profiles enable row level security;
alter table public.ad_stats enable row level security;
alter table public.leads enable row level security;
alter table public.orders enable row level security;
alter table public.stock_moves enable row level security;
alter table public.notes enable row level security;
alter table public.settings enable row level security;

-- профили: каждый видит себя, admin и owner видят всех; роли меняет только admin
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select
  using (id = auth.uid() or public.my_role() in ('admin', 'owner'));
drop policy if exists "profiles admin write" on public.profiles;
create policy "profiles admin write" on public.profiles for update
  using (public.my_role() = 'admin');

-- реклама, склад, настройки: читают все вошедшие, пишет admin
do $$
declare t text;
begin
  foreach t in array array['ad_stats', 'stock_moves', 'settings'] loop
    execute format('drop policy if exists "%1$s read" on public.%1$I', t);
    execute format('create policy "%1$s read" on public.%1$I for select using (public.my_role() in (''admin'', ''manager'', ''owner''))', t);
    execute format('drop policy if exists "%1$s admin" on public.%1$I', t);
    execute format('create policy "%1$s admin" on public.%1$I for all using (public.my_role() = ''admin'') with check (public.my_role() = ''admin'')', t);
  end loop;
end $$;

-- лиды и заказы: admin/owner видят всё, manager — только свои; owner ничего не меняет
do $$
declare t text;
begin
  foreach t in array array['leads', 'orders'] loop
    execute format('drop policy if exists "%1$s read" on public.%1$I', t);
    execute format('create policy "%1$s read" on public.%1$I for select using (public.my_role() in (''admin'', ''owner'') or manager_id = auth.uid())', t);
    execute format('drop policy if exists "%1$s insert" on public.%1$I', t);
    execute format('create policy "%1$s insert" on public.%1$I for insert with check (public.my_role() = ''admin'' or (public.my_role() = ''manager'' and manager_id = auth.uid()))', t);
    execute format('drop policy if exists "%1$s update" on public.%1$I', t);
    execute format('create policy "%1$s update" on public.%1$I for update using (public.my_role() = ''admin'' or (public.my_role() = ''manager'' and manager_id = auth.uid()))', t);
    execute format('drop policy if exists "%1$s delete" on public.%1$I', t);
    execute format('create policy "%1$s delete" on public.%1$I for delete using (public.my_role() = ''admin'')', t);
  end loop;
end $$;

-- заметки: читают все вошедшие, пишут admin и manager
drop policy if exists "notes read" on public.notes;
create policy "notes read" on public.notes for select using (public.my_role() in ('admin', 'manager', 'owner'));
drop policy if exists "notes write" on public.notes;
create policy "notes write" on public.notes for insert
  with check (public.my_role() in ('admin', 'manager') and author_id = auth.uid());
drop policy if exists "notes delete" on public.notes;
create policy "notes delete" on public.notes for delete
  using (author_id = auth.uid() or public.my_role() = 'admin');

-- ========== Выдать доступ ==========
-- Новый пользователь получает роль pending и ничего не видит.
-- Выдать роль: Table Editor -> profiles -> поменять role на admin / manager / owner.

-- ========== Первый админ ==========
-- 1) Зарегистрируйтесь на сайте (или Authentication -> Users -> Add user)
-- 2) Выполните, подставив свой email:
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
