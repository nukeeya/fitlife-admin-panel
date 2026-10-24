-- Retire the Gym Shop: every shop product and the public storefront now belong to the Coffee Shop.
-- Food items become active coffee shop menu items. Gym Wear has no place on a cafe menu, so it is
-- moved over as Archived — the rows (and their stock/cost history) are kept for staff to review
-- or delete from Coffee Shop → Menu & Stock, but nothing is sold until someone reactivates it.

update public.shop_products
  set category = 'Cafe'
  where category = 'Food';

update public.shop_products
  set category = 'Cafe',
      status = 'Archived'
  where category = 'Gym Wear';

alter table public.shop_products
  alter column category set default 'Cafe';

-- Public storefront: only active coffee shop menu items are visible.
drop policy if exists "public read active shop products" on public.shop_products;
create policy "public read active shop products"
  on public.shop_products for select to anon
  using (status = 'Active' and category = 'Cafe');

-- Online orders: same as 007, but only coffee shop menu items can be ordered.
create or replace function public.submit_shop_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_delivery_address text,
  p_customer_note text,
  p_items jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry jsonb;
  v_product record;
  v_product_id bigint;
  v_quantity int;
  v_seen_ids bigint[] := '{}';
  v_items jsonb := '[]'::jsonb;
  v_total numeric(12, 2) := 0;
  v_order_id bigint;
begin
  if char_length(trim(coalesce(p_customer_name, ''))) not between 2 and 100 then
    raise exception 'Please enter a name between 2 and 100 characters.';
  end if;
  if char_length(trim(coalesce(p_phone, ''))) not between 6 and 30 then
    raise exception 'Please enter a valid phone number.';
  end if;
  if p_email is not null and char_length(p_email) > 254 then
    raise exception 'Email address is too long.';
  end if;
  if char_length(trim(coalesce(p_delivery_address, ''))) not between 4 and 500 then
    raise exception 'Please enter a delivery address between 4 and 500 characters.';
  end if;
  if p_customer_note is not null and char_length(p_customer_note) > 1000 then
    raise exception 'Order note is too long.';
  end if;
  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'Your cart is empty or contains too many items.';
  end if;

  for v_entry in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_entry->>'product_id')::bigint;
    v_quantity := (v_entry->>'quantity')::int;

    if v_product_id = any(v_seen_ids) then
      raise exception 'A menu item appears more than once in the cart.';
    end if;
    if v_quantity < 1 or v_quantity > 100 then
      raise exception 'Item quantities must be between 1 and 100.';
    end if;

    select id, name, category, brand, price, stock, unit, size, image_url
    into v_product
    from public.shop_products
    where id = v_product_id and status = 'Active' and category = 'Cafe';

    if not found then
      raise exception 'One of the menu items is no longer available.';
    end if;
    if v_product.stock < v_quantity then
      raise exception 'Not enough stock for "%".', v_product.name;
    end if;

    v_seen_ids := array_append(v_seen_ids, v_product_id);
    v_total := v_total + v_product.price * v_quantity;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'productId', v_product.id,
      'name', v_product.name,
      'category', v_product.category,
      'brand', v_product.brand,
      'price', v_product.price,
      'quantity', v_quantity,
      'unit', v_product.unit,
      'size', v_product.size,
      'imageUrl', v_product.image_url
    ));
  end loop;

  insert into public.shop_orders (
    customer_name, phone, email, delivery_address, customer_note, items, total
  )
  values (
    trim(p_customer_name),
    trim(p_phone),
    nullif(trim(coalesce(p_email, '')), ''),
    trim(p_delivery_address),
    nullif(trim(coalesce(p_customer_note, '')), ''),
    v_items,
    v_total
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.submit_shop_order(text, text, text, text, text, jsonb) from public;
grant execute on function public.submit_shop_order(text, text, text, text, text, jsonb) to anon, authenticated;
