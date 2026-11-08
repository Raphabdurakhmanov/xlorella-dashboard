-- Xlorella: обновление 002 — склад списывается автоматически при заказе.
-- Запустить один раз: Supabase -> SQL Editor -> вставить файл -> Run.
-- Можно запускать повторно.

-- при создании заказа: минус бутылки со склада
-- при смене статуса доставки на "возврат": плюс обратно
create or replace function public.order_stock_move()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.stock_moves (quantity, reason, order_id)
    values (-new.quantity, 'order', new.id);
  elsif tg_op = 'UPDATE' then
    if new.delivery_status = 'returned' and old.delivery_status <> 'returned' then
      insert into public.stock_moves (quantity, reason, order_id)
      values (new.quantity, 'return', new.id);
    elsif old.delivery_status = 'returned' and new.delivery_status <> 'returned' then
      insert into public.stock_moves (quantity, reason, order_id)
      values (-new.quantity, 'order', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_stock on public.orders;
create trigger orders_stock
  after insert or update of delivery_status on public.orders
  for each row execute function public.order_stock_move();

-- заметка к заказу/лиду может быть и без лида
alter table public.notes alter column lead_id drop not null;
