-- Harumi Store Supabase SQL Editor Full Setup
-- Paste file ini sekali ke Supabase SQL Editor.
-- File migration di supabase/migrations tetap disimpan untuk history development.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  name text not null,
  slug text not null unique,
  description text not null,
  condition_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_path text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  color text,
  sku text,
  stock int not null default 0 check (stock >= 0),
  hpp numeric(12,2) not null default 0 check (hpp >= 0),
  selling_price numeric(12,2) not null default 0 check (selling_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_variants
add column if not exists color text;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  phone text unique,
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

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

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default current_date,
  customer_id uuid references public.customer_profiles(id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_address_snapshot text,
  note text,
  other_cost numeric(12,2) not null default 0 check (other_cost >= 0),
  created_at timestamptz not null default now()
);

alter table public.sales
add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null,
add column if not exists customer_address_snapshot text;

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid not null references public.product_variants(id),
  qty int not null check (qty > 0),
  hpp numeric(12,2) not null check (hpp >= 0),
  selling_price numeric(12,2) not null check (selling_price >= 0),
  gross_revenue numeric(12,2) generated always as (qty * selling_price) stored,
  total_hpp numeric(12,2) generated always as (qty * hpp) stored,
  net_profit numeric(12,2) generated always as ((qty * selling_price) - (qty * hpp)) stored,
  created_at timestamptz not null default now()
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

create table if not exists public.wa_click_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  customer_id uuid references public.customer_profiles(id) on delete set null,
  checkout_intent_id uuid references public.checkout_intents(id) on delete set null,
  source text,
  referrer text,
  created_at timestamptz not null default now()
);

alter table public.wa_click_events
add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null,
add column if not exists checkout_intent_id uuid references public.checkout_intents(id) on delete set null;

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'Harumi Store',
  admin_whatsapp text not null default '',
  instagram_url text,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists set_customer_profiles_updated_at on public.customer_profiles;
create trigger set_customer_profiles_updated_at
before update on public.customer_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

create index if not exists categories_slug_idx on public.categories(slug);
create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_is_active_idx on public.products(is_active);
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_size_idx on public.product_variants(size);
create index if not exists admin_users_auth_user_id_idx on public.admin_users(auth_user_id);
create index if not exists admin_users_phone_idx on public.admin_users(phone);
create index if not exists customer_profiles_auth_user_id_idx on public.customer_profiles(auth_user_id);
create index if not exists customer_profiles_phone_idx on public.customer_profiles(phone);
create index if not exists sales_sale_date_idx on public.sales(sale_date);
create index if not exists sales_customer_id_idx on public.sales(customer_id);
create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);
create index if not exists checkout_intents_customer_id_idx on public.checkout_intents(customer_id);
create index if not exists checkout_intents_product_id_idx on public.checkout_intents(product_id);
create index if not exists checkout_intents_created_at_idx on public.checkout_intents(created_at);
create index if not exists wa_click_events_created_at_idx on public.wa_click_events(created_at);
create index if not exists wa_click_events_customer_id_idx on public.wa_click_events(customer_id);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.admin_users enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.checkout_intents enable row level security;
alter table public.wa_click_events enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Admin manage categories" on public.categories;
create policy "Admin manage categories"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
on public.products for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admin manage products" on public.products;
create policy "Admin manage products"
on public.products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public read active product images" on public.product_images;
create policy "Public read active product images"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active = true
  )
);

drop policy if exists "Admin manage product images" on public.product_images;
create policy "Admin manage product images"
on public.product_images for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public read active product variants" on public.product_variants;
create policy "Public read active product variants"
on public.product_variants for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.is_active = true
  )
);

drop policy if exists "Admin manage product variants" on public.product_variants;
create policy "Admin manage product variants"
on public.product_variants for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

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

drop policy if exists "Public read store settings" on public.store_settings;
create policy "Public read store settings"
on public.store_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admin manage store settings" on public.store_settings;
create policy "Admin manage store settings"
on public.store_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.categories (name, slug)
values
  ('Daster', 'daster'),
  ('Sepatu Thrifting', 'sepatu-thrifting')
on conflict (slug) do update set name = excluded.name;

insert into public.store_settings (id, store_name, admin_whatsapp)
values ('00000000-0000-0000-0000-000000000001', 'Harumi Store', '')
on conflict (id) do update set store_name = excluded.store_name;

insert into public.admin_users (phone, label, is_active)
values ('+6281339691260', 'Harumi testing admin', true)
on conflict (phone) do update set
  label = excluded.label,
  is_active = excluded.is_active;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images bucket" on storage.objects;
create policy "Public read product images bucket"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admin manage product images bucket" on storage.objects;
create policy "Admin manage product images bucket"
on storage.objects for all
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());
