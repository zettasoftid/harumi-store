create or replace function public.current_auth_phone()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      auth.jwt() ->> 'phone',
      auth.jwt() #>> '{user_metadata,phone}'
    ),
    ''
  );
$$;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  phone text unique,
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.is_active = true
      and (
        admin_users.auth_user_id = auth.uid()
        or (
          admin_users.phone is not null
          and admin_users.phone = public.current_auth_phone()
        )
      )
  );
$$;

grant execute on function public.current_auth_phone() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  phone text not null unique,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_intents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid not null references public.product_variants(id),
  qty int not null check (qty > 0),
  stock_status text not null check (stock_status in ('ready', 'po')),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) generated always as (qty * unit_price) stored,
  source text,
  created_at timestamptz not null default now()
);

alter table public.sales
add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null,
add column if not exists customer_address_snapshot text;

alter table public.wa_click_events
add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null,
add column if not exists checkout_intent_id uuid references public.checkout_intents(id) on delete set null;

drop trigger if exists set_customer_profiles_updated_at on public.customer_profiles;
create trigger set_customer_profiles_updated_at
before update on public.customer_profiles
for each row execute function public.set_updated_at();

create index if not exists admin_users_auth_user_id_idx on public.admin_users(auth_user_id);
create index if not exists admin_users_phone_idx on public.admin_users(phone);
create index if not exists customer_profiles_auth_user_id_idx on public.customer_profiles(auth_user_id);
create index if not exists customer_profiles_phone_idx on public.customer_profiles(phone);
create index if not exists checkout_intents_customer_id_idx on public.checkout_intents(customer_id);
create index if not exists checkout_intents_product_id_idx on public.checkout_intents(product_id);
create index if not exists checkout_intents_created_at_idx on public.checkout_intents(created_at);
create index if not exists sales_customer_id_idx on public.sales(customer_id);
create index if not exists wa_click_events_customer_id_idx on public.wa_click_events(customer_id);

alter table public.admin_users enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.checkout_intents enable row level security;

drop policy if exists "Admin read admin users" on public.admin_users;
create policy "Admin read admin users"
on public.admin_users for select
to authenticated
using (public.is_admin());

drop policy if exists "Admin manage admin users" on public.admin_users;
create policy "Admin manage admin users"
on public.admin_users for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Customers read own profile" on public.customer_profiles;
create policy "Customers read own profile"
on public.customer_profiles for select
to authenticated
using (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "Customers insert own profile" on public.customer_profiles;
create policy "Customers insert own profile"
on public.customer_profiles for insert
to authenticated
with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "Customers update own profile" on public.customer_profiles;
create policy "Customers update own profile"
on public.customer_profiles for update
to authenticated
using (auth_user_id = auth.uid() or public.is_admin())
with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "Admin manage customer profiles" on public.customer_profiles;
create policy "Admin manage customer profiles"
on public.customer_profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Customers insert own checkout intents" on public.checkout_intents;
create policy "Customers insert own checkout intents"
on public.checkout_intents for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.customer_profiles
    where customer_profiles.id = checkout_intents.customer_id
      and customer_profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers read own checkout intents" on public.checkout_intents;
create policy "Customers read own checkout intents"
on public.checkout_intents for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.customer_profiles
    where customer_profiles.id = checkout_intents.customer_id
      and customer_profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Admin manage checkout intents" on public.checkout_intents;
create policy "Admin manage checkout intents"
on public.checkout_intents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin manage categories" on public.categories;
create policy "Admin manage categories"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin manage products" on public.products;
create policy "Admin manage products"
on public.products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin manage product images" on public.product_images;
create policy "Admin manage product images"
on public.product_images for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin manage product variants" on public.product_variants;
create policy "Admin manage product variants"
on public.product_variants for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin manage sales" on public.sales;
create policy "Admin manage sales"
on public.sales for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin manage sale items" on public.sale_items;
create policy "Admin manage sale items"
on public.sale_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public insert WhatsApp click events" on public.wa_click_events;
create policy "Public insert WhatsApp click events"
on public.wa_click_events for insert
to anon, authenticated
with check (
  customer_id is null
  or public.is_admin()
  or exists (
    select 1
    from public.customer_profiles
    where customer_profiles.id = wa_click_events.customer_id
      and customer_profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Admin read WhatsApp click events" on public.wa_click_events;
create policy "Admin read WhatsApp click events"
on public.wa_click_events for select
to authenticated
using (public.is_admin());

drop policy if exists "Admin manage store settings" on public.store_settings;
create policy "Admin manage store settings"
on public.store_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin manage product images bucket" on storage.objects;
create policy "Admin manage product images bucket"
on storage.objects for all
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

insert into public.admin_users (phone, label, is_active)
values ('+6281339691260', 'Harumi testing admin', true)
on conflict (phone) do update set
  label = excluded.label,
  is_active = excluded.is_active;
