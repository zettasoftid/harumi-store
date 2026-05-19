# PRD dan Technical Spec - Harumi Store

## 1. Ringkasan Produk

Harumi Store adalah toko online berbentuk katalog produk, checkout sederhana via akun customer + WhatsApp, dan dashboard admin. Fokus utama toko adalah penjualan daster dan sepatu thrifting dengan market awal orang pabrik serta jaringan teman ke teman.

Halaman depan menampilkan katalog produk tanpa login. Ketika calon pembeli checkout, pembeli wajib masuk/daftar akun dengan nama, no HP, password, dan alamat. Aplikasi akan membuka WhatsApp admin dengan pesan otomatis berisi detail produk, varian, qty, status ready/PO, dan alamat pembeli. Dashboard digunakan admin untuk mengelola katalog, ukuran, harga, HPP, stok sederhana, laporan penjualan, customer, dan winning product.

Nama Harumi membawa filosofi "indah seperti sakura, tetapi tetap teguh". Secara brand, tampilannya perlu terasa cantik, ramah, sederhana, dan terpercaya, namun tetap praktis untuk target pembeli yang ingin cepat lihat barang dan langsung chat.

## 2. Tujuan Produk

1. Membuat katalog online yang mudah dibagikan ke calon pembeli.
2. Mempermudah calon pembeli melihat produk, ukuran, harga, dan deskripsi.
3. Mempercepat proses pemesanan dengan redirect ke WhatsApp admin.
4. Membantu admin mengelola produk tanpa perlu coding.
5. Menyediakan laporan penjualan sederhana: HPP, gross revenue, harga jual, net profit, dan jumlah produk terjual.
6. Memetakan histori checkout dan penjualan per customer agar admin tahu produk paling laku dan pola pembelian customer.

## 3. Target Pengguna

### Pembeli

- Orang pabrik yang ingin membeli pakaian harian seperti daster dengan harga terjangkau.
- Pembeli dari rekomendasi teman ke teman.
- Pembeli yang terbiasa transaksi lewat WhatsApp.
- Pembeli yang ingin melihat foto, ukuran, kondisi, dan harga tanpa login, tetapi bersedia membuat akun saat checkout supaya alamat dan histori pesanan tersimpan.

### Admin Harumi Store

- Pemilik/admin toko yang mengelola katalog.
- Membutuhkan input produk cepat.
- Membutuhkan laporan sederhana untuk melihat keuntungan.
- Membutuhkan insight winning product dan customer yang paling sering membeli.
- Tidak membutuhkan sistem marketplace penuh pada fase awal.

## 4. Positioning dan Brand

### Brand Personality

- Cantik dan sederhana.
- Hangat dan dekat dengan pembeli.
- Terpercaya.
- Teguh dan rapi dalam pengelolaan produk.

### Visual Direction

- Inspirasi visual: sakura, bersih, feminin, namun tidak terlalu ramai.
- Warna utama yang disarankan:
  - Sakura pink: `#EFA3B4`
  - Deep rose: `#B94763`
  - Warm cream: `#FFF8F2`
  - Charcoal: `#2B2B2B`
  - Soft green accent: `#7A9B76`
- UI katalog harus sederhana, cepat discan, dan nyaman di mobile.

## 5. Scope MVP

### Public Catalog

- Halaman katalog semua produk.
- Filter kategori: Daster, Sepatu Thrifting.
- Search nama produk.
- Filter ukuran.
- Filter status: tersedia, habis.
- Detail produk berisi:
  - Foto produk.
  - Nama produk.
  - Kategori.
  - Size.
  - Harga jual.
  - Deskripsi lengkap.
  - Kondisi barang, terutama untuk sepatu thrifting.
  - Tombol "Checkout".
- Tombol checkout wajib memakai akun customer.
- Akun customer berisi nama, no HP, password, dan alamat.
- Checkout mengarah ke WhatsApp admin dengan pesan otomatis berisi detail produk, varian, qty, status ready/PO, nama, no HP, dan alamat.
- Sistem menyimpan checkout intent untuk membaca minat produk sebelum transaksi selesai.

### Dashboard Admin

- Login admin.
- Ringkasan performa:
  - Total produk aktif.
  - Produk habis.
  - Total gross revenue.
  - Total net profit.
  - Jumlah penjualan bulan ini.
  - Jumlah klik WhatsApp.
  - Jumlah customer.
  - Repeat customer.
  - Winning product dari penjualan terkonfirmasi.
  - Produk dengan minat checkout tertinggi.
- CRUD produk.
- Upload foto produk.
- Kelola size dan stok.
- Kelola HPP dan harga jual.
- Input penjualan manual setelah transaksi WhatsApp selesai.
- Hubungkan penjualan manual ke customer berdasarkan pilihan customer atau auto-match no HP.
- Laporan penjualan.

### Laporan Penjualan

Minimal laporan berisi:

- Tanggal transaksi.
- Produk.
- Size.
- Qty.
- HPP per item.
- Harga jual per item.
- Gross revenue.
- Net profit.
- Nama pembeli opsional.
- No HP pembeli opsional.
- Alamat pembeli snapshot.
- Customer ID jika pembeli memakai akun.
- Catatan opsional.

Formula:

- `gross_revenue = harga_jual * qty`
- `total_hpp = hpp * qty`
- `net_profit = gross_revenue - total_hpp - biaya_lain`

`biaya_lain` bersifat opsional, misalnya diskon, ongkir subsidi, packing, atau biaya admin.

## 6. Out of Scope MVP

- Payment gateway.
- Checkout cart kompleks.
- Multi admin role detail.
- Integrasi resi otomatis.
- Marketplace seller center.
- Loyalty program.
- Akuntansi lengkap.

Fitur ini bisa masuk fase berikutnya setelah katalog dan laporan dasar stabil.

## 7. User Flow

### Flow Pembeli

1. Pembeli membuka link Harumi Store.
2. Pembeli melihat katalog.
3. Pembeli memakai search/filter jika perlu.
4. Pembeli klik produk.
5. Pembeli membaca detail produk dan memilih size jika tersedia.
6. Pembeli klik "Checkout".
7. Jika belum login, pembeli masuk atau daftar akun dengan nama, no HP, password, dan alamat.
8. Pembeli bisa memperbarui nama/alamat sebelum checkout.
9. Sistem menyimpan checkout intent dan klik WhatsApp.
10. Aplikasi membuka WhatsApp dengan pesan otomatis.
11. Transaksi dilanjutkan manual di WhatsApp.

Contoh pesan WhatsApp:

```text
Halo Admin Harumi Store, saya tertarik dengan produk ini:

Produk: Daster Sakura Rayon
Kategori: Daster
Size: L
Warna: Pink
Qty: 1
Status: Ready stock
Harga: Rp65.000
Subtotal: Rp65.000
Nama: Siti
No. HP: +6281234567890
Alamat: Jl. Sakura No. 12, Karawang
Link: https://harumistore.com/products/daster-sakura-rayon

Apakah produk ini masih tersedia?
```

### Flow Admin

1. Admin login ke dashboard.
2. Admin menambahkan produk baru.
3. Admin mengisi foto, nama, kategori, size, deskripsi, HPP, harga jual, dan stok.
4. Produk tampil di katalog jika status aktif.
5. Ketika transaksi WhatsApp berhasil, admin input data penjualan.
6. Admin memilih customer atau sistem auto-match berdasarkan no HP pembeli.
7. Dashboard memperbarui laporan revenue, net profit, winning product, dan pola customer.

## 8. Functional Requirements

### Catalog

| ID | Requirement | Priority |
| --- | --- | --- |
| CAT-001 | Menampilkan list produk aktif | Must |
| CAT-002 | Menampilkan foto utama produk | Must |
| CAT-003 | Menampilkan harga jual | Must |
| CAT-004 | Menampilkan badge kategori | Must |
| CAT-005 | Filter berdasarkan kategori | Must |
| CAT-006 | Filter berdasarkan size | Should |
| CAT-007 | Search produk berdasarkan nama/deskripsi | Should |
| CAT-008 | Menampilkan produk habis dengan status jelas | Should |

### Product Detail

| ID | Requirement | Priority |
| --- | --- | --- |
| PDT-001 | Menampilkan deskripsi lengkap | Must |
| PDT-002 | Menampilkan pilihan size/variant | Must |
| PDT-003 | Menampilkan harga jual sesuai variant | Must |
| PDT-004 | Menampilkan galeri foto | Should |
| PDT-005 | Tombol redirect WhatsApp admin | Must |
| PDT-006 | Pesan WhatsApp otomatis sesuai produk dan size | Must |
| PDT-007 | Checkout wajib login/daftar akun customer | Must |
| PDT-008 | Pesan WhatsApp memuat alamat customer | Must |

### Customer Account

| ID | Requirement | Priority |
| --- | --- | --- |
| CUS-001 | Customer bisa daftar dengan nama, no HP, password, dan alamat | Must |
| CUS-002 | Customer bisa login dengan no HP dan password | Must |
| CUS-003 | Customer bisa memperbarui nama dan alamat sebelum checkout | Must |
| CUS-004 | Sistem menyimpan profile customer di database/server, bukan browser localStorage | Must |
| CUS-005 | Sistem menyimpan checkout intent ketika WhatsApp checkout dibuka | Must |

### Admin Product Management

| ID | Requirement | Priority |
| --- | --- | --- |
| ADM-001 | Admin bisa login | Must |
| ADM-002 | Admin bisa tambah produk | Must |
| ADM-003 | Admin bisa edit produk | Must |
| ADM-004 | Admin bisa arsip/nonaktifkan produk | Must |
| ADM-005 | Admin bisa upload foto | Must |
| ADM-006 | Admin bisa mengelola size, stok, HPP, dan harga jual | Must |
| ADM-007 | Admin bisa menghubungkan penjualan manual ke customer | Must |
| ADM-008 | Admin bisa melihat winning product dan customer paling aktif di dashboard | Must |

### Sales Report

| ID | Requirement | Priority |
| --- | --- | --- |
| REP-001 | Admin bisa input penjualan manual | Must |
| REP-002 | Sistem menghitung gross revenue | Must |
| REP-003 | Sistem menghitung net profit | Must |
| REP-004 | Filter laporan berdasarkan tanggal | Must |
| REP-005 | Filter laporan berdasarkan kategori | Should |
| REP-006 | Export CSV | Should |
| REP-007 | Laporan menyimpan customer ID dan alamat snapshot jika tersedia | Must |
| REP-008 | Dashboard menampilkan produk paling laku berdasarkan qty/revenue/profit | Must |

## 9. Data yang Dibutuhkan

### Product

- Nama produk.
- Slug.
- Kategori.
- Deskripsi lengkap.
- Foto.
- Status aktif/nonaktif.
- Status kondisi barang.
- Catatan khusus.

### Variant / Size

- Size.
- Stok.
- HPP.
- Harga jual.
- SKU opsional.
- Warna opsional.

### Customer

- Nama customer.
- No HP customer dalam format normal `+62`.
- Password dikelola melalui Supabase Auth atau hash server lokal.
- Alamat customer.
- Tanggal daftar dan update terakhir.

### Sales

- Tanggal transaksi.
- Pembeli opsional.
- Customer ID opsional.
- Alamat pembeli snapshot.
- Produk.
- Variant/size.
- Qty.
- HPP.
- Harga jual.
- Biaya lain.
- Gross revenue.
- Net profit.

### WhatsApp Lead

- Produk yang diklik.
- Variant/size yang dipilih.
- Customer yang checkout jika sudah login.
- Checkout intent ID jika berasal dari checkout akun.
- Waktu klik.
- Source/referrer opsional.

### Checkout Intent

- Customer.
- Produk dan variant.
- Qty.
- Status stok saat checkout: `ready` atau `po`.
- Unit price dan subtotal.
- Source halaman.
- Waktu checkout.

## 10. Technical Stack

### Frontend

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui atau komponen internal sederhana.
- React Hook Form untuk form admin.
- Zod untuk validasi form.
- TanStack Table untuk laporan/dashboard table.

### Backendless Layer

- Supabase Auth untuk login admin.
- Supabase Auth phone + password untuk akun customer.
- Supabase Database/PostgreSQL untuk data produk dan penjualan.
- Supabase Storage untuk foto produk.
- Supabase Row Level Security untuk keamanan data.
- Supabase client langsung dari aplikasi frontend dengan RLS.
- Local backend mode menyimpan profile customer, hash password, session dev, dan checkout intent di server lokal.

Catatan: aplikasi ini "backendless" dalam arti tidak membutuhkan custom backend server. Next.js tetap digunakan untuk frontend, SSR/SSG, dan routing. Operasi data dilakukan ke Supabase dengan RLS.

### Deployment

- Vercel untuk Next.js.
- Supabase hosted project.
- Domain custom: contoh `harumistore.com`.

## 11. Information Architecture

### Public Pages

- `/` - katalog utama.
- `/products` - halaman semua produk.
- `/products/[slug]` - detail produk.
- `/category/daster` - katalog kategori daster.
- `/category/sepatu-thrifting` - katalog kategori sepatu thrifting.
- Login/daftar customer muncul sebagai modal saat checkout, bukan halaman terpisah pada MVP.

### Admin Pages

- `/admin/login` - login admin.
- `/admin` - dashboard overview.
- `/admin/products` - daftar produk.
- `/admin/products/new` - tambah produk.
- `/admin/products/[id]/edit` - edit produk.
- `/admin/sales` - input dan laporan penjualan.
- `/admin/settings` - nomor WhatsApp admin dan pengaturan toko.

## 12. Database Design Supabase

### `categories`

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);
```

### `products`

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  name text not null,
  slug text not null unique,
  description text not null,
  condition_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `product_images`

```sql
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_path text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
```

### `product_variants`

```sql
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text not null,
  color text,
  sku text,
  stock int not null default 0,
  hpp numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `admin_users`

```sql
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  phone text unique,
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### `customer_profiles`

```sql
create table customer_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  phone text not null unique,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `sales`

```sql
create table sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default current_date,
  customer_id uuid references customer_profiles(id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_address_snapshot text,
  note text,
  other_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
```

### `sale_items`

```sql
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid not null references product_variants(id),
  qty int not null check (qty > 0),
  hpp numeric(12,2) not null,
  selling_price numeric(12,2) not null,
  gross_revenue numeric(12,2) generated always as (qty * selling_price) stored,
  total_hpp numeric(12,2) generated always as (qty * hpp) stored,
  net_profit numeric(12,2) generated always as ((qty * selling_price) - (qty * hpp)) stored,
  created_at timestamptz not null default now()
);
```

Catatan: jika `other_cost` ingin dibagi per item, perhitungan net final bisa dibuat di query/report, bukan generated column.

### `checkout_intents`

```sql
create table checkout_intents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer_profiles(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid not null references product_variants(id),
  qty int not null check (qty > 0),
  stock_status text not null check (stock_status in ('ready', 'po')),
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) generated always as (qty * unit_price) stored,
  source text,
  created_at timestamptz not null default now()
);
```

### `wa_click_events`

```sql
create table wa_click_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  customer_id uuid references customer_profiles(id) on delete set null,
  checkout_intent_id uuid references checkout_intents(id) on delete set null,
  source text,
  referrer text,
  created_at timestamptz not null default now()
);
```

### `store_settings`

```sql
create table store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'Harumi Store',
  admin_whatsapp text not null,
  instagram_url text,
  updated_at timestamptz not null default now()
);
```

## 13. RLS Policy Direction

### Public Read

- Public boleh membaca:
  - `categories`
  - `products` yang `is_active = true`
  - `product_images`
  - `product_variants` yang `is_active = true`
  - `store_settings` terbatas untuk nomor WhatsApp dan nama toko

### Public Insert

- Public boleh insert ke `wa_click_events` tanpa customer untuk tracking klik WhatsApp dasar.
- Customer yang login boleh insert `checkout_intents` dan `wa_click_events` miliknya sendiri.

### Customer Access

- Customer boleh membaca dan update `customer_profiles` miliknya sendiri.
- Customer tidak boleh membaca customer lain.
- Customer tidak boleh insert/update produk, sales, settings, atau laporan admin.

### Admin Full Access

- User yang login sebagai admin dan terdaftar di `admin_users` boleh:
  - insert/update/delete produk.
  - upload gambar.
  - insert/update/delete sales.
  - melihat semua laporan.
  - melihat semua customer dan checkout intent.

Implementasi sederhana MVP:

- Buat satu user admin di Supabase Auth.
- Gunakan helper `is_admin()` berbasis `admin_users`, bukan semua `authenticated`.
- Seed admin testing dengan phone `+6281339691260`.
- Jangan expose service role key di frontend.

## 14. UI/UX Requirements

### Public Catalog

- Mobile-first.
- Produk tampil dalam grid 2 kolom di mobile dan 3-4 kolom di desktop.
- Card produk menampilkan foto, nama, size ringkas, harga, dan status stok.
- CTA utama: "Checkout".
- Detail produk harus punya foto besar dan informasi lengkap.
- Untuk sepatu thrifting, kondisi barang harus jelas agar mengurangi komplain.
- Login/daftar customer muncul hanya saat checkout supaya browsing katalog tetap ringan.
- Alamat customer harus mudah dilihat dan diedit sebelum WhatsApp dibuka.

### Dashboard

- Layout sidebar.
- Table produk dengan search dan filter.
- Form produk harus cepat diisi.
- Laporan penjualan memakai table dengan filter tanggal.
- Angka uang memakai format Rupiah.
- Dashboard menampilkan winning product, minat checkout, customer aktif, dan repeat customer.

## 15. Success Metrics

- Jumlah klik WhatsApp per minggu.
- Jumlah checkout intent per minggu.
- Jumlah customer terdaftar.
- Repeat customer.
- Produk aktif di katalog.
- Jumlah transaksi yang dicatat admin.
- Gross revenue bulanan.
- Net profit bulanan.
- Produk paling sering diklik.
- Winning product berdasarkan qty terjual, revenue, dan profit.
- Customer yang paling sering membeli dan produk favoritnya.

## 16. MVP Milestones

### Milestone 1 - Foundation

- Setup Next.js TypeScript.
- Setup Tailwind.
- Setup Supabase client.
- Setup database schema.
- Setup auth admin.

### Milestone 2 - Public Catalog

- Katalog produk.
- Detail produk.
- Filter kategori dan size.
- Redirect WhatsApp dengan pesan otomatis.
- Login/daftar customer di checkout.
- Simpan checkout intent dan alamat customer.

### Milestone 3 - Admin Product Management

- Login admin.
- CRUD produk.
- Upload foto.
- Kelola size, HPP, harga jual, stok.

### Milestone 4 - Sales Report

- Input penjualan manual.
- Dashboard summary.
- Winning product dan customer analytics.
- Table laporan.
- Filter tanggal.
- Export CSV jika waktu memungkinkan.

## 17. Risks dan Mitigasi

| Risk | Impact | Mitigasi |
| --- | --- | --- |
| Transaksi terjadi di WhatsApp sehingga sistem tidak tahu penjualan otomatis | Laporan bisa tidak akurat | Admin wajib input penjualan setelah deal |
| Produk thrifting sering unik dan stok terbatas | Pembeli bisa chat produk yang sudah habis | Stok harus cepat diupdate, tampilkan status habis |
| Foto produk kurang jelas | Conversion turun | Wajib foto utama dan deskripsi kondisi |
| Nomor WhatsApp berubah | CTA rusak | Simpan nomor di `store_settings` |
| Customer login membuat semua user `authenticated` | Data admin bocor jika policy admin terlalu umum | Gunakan `admin_users` dan helper `is_admin()` |
| RLS salah konfigurasi | Data admin bocor | Pisahkan public read, customer-own data, dan admin write dengan policy ketat |
| Customer lupa password | Checkout tertahan | Fase berikutnya dapat menambah OTP/reset password |

## 18. Recommended Build Order

1. Buat schema Supabase dan seed kategori.
2. Setup Next.js project.
3. Buat public catalog dari data dummy.
4. Hubungkan Supabase read.
5. Buat detail produk dan WhatsApp redirect.
6. Buat customer account checkout.
7. Buat admin auth dengan `admin_users`.
8. Buat CRUD produk dan upload image.
9. Buat input penjualan yang terhubung customer.
10. Buat dashboard report, winning product, dan customer analytics.
11. Polish mobile UI dan deploy.

## 19. Acceptance Criteria MVP

- Pembeli bisa membuka katalog tanpa login.
- Pembeli bisa melihat detail produk.
- Pembeli wajib login/daftar sebelum checkout.
- Pembeli bisa klik produk dan diarahkan ke WhatsApp admin dengan pesan otomatis.
- Pesan WhatsApp memuat nama, no HP, alamat, produk, varian, qty, harga, dan status ready/PO.
- Sistem menyimpan checkout intent dan klik WhatsApp dengan customer ID.
- Admin bisa login.
- Customer login tidak bisa mengakses admin atau CRUD katalog/sales.
- Admin bisa menambah, mengedit, dan menonaktifkan produk.
- Admin bisa mengatur size, HPP, harga jual, dan stok.
- Admin bisa input penjualan dan menghubungkannya ke customer.
- Dashboard menampilkan gross revenue dan net profit.
- Dashboard menampilkan winning product dari penjualan terkonfirmasi.
- Dashboard menampilkan customer paling aktif dan repeat customer.
- Data produk dan penjualan tersimpan di Supabase.
- Foto produk tersimpan di Supabase Storage.
