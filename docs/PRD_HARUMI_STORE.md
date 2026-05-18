# PRD dan Technical Spec - Harumi Store

## 1. Ringkasan Produk

Harumi Store adalah toko online berbentuk katalog produk dan dashboard admin. Fokus utama toko adalah penjualan daster dan sepatu thrifting dengan market awal orang pabrik serta jaringan teman ke teman.

Halaman depan menampilkan katalog produk. Ketika calon pembeli memilih produk, aplikasi akan membuka WhatsApp admin dengan pesan otomatis yang berisi detail produk yang dipilih. Dashboard digunakan admin untuk mengelola katalog, ukuran, harga, HPP, stok sederhana, dan laporan penjualan.

Nama Harumi membawa filosofi "indah seperti sakura, tetapi tetap teguh". Secara brand, tampilannya perlu terasa cantik, ramah, sederhana, dan terpercaya, namun tetap praktis untuk target pembeli yang ingin cepat lihat barang dan langsung chat.

## 2. Tujuan Produk

1. Membuat katalog online yang mudah dibagikan ke calon pembeli.
2. Mempermudah calon pembeli melihat produk, ukuran, harga, dan deskripsi.
3. Mempercepat proses pemesanan dengan redirect ke WhatsApp admin.
4. Membantu admin mengelola produk tanpa perlu coding.
5. Menyediakan laporan penjualan sederhana: HPP, gross revenue, harga jual, net profit, dan jumlah produk terjual.

## 3. Target Pengguna

### Pembeli

- Orang pabrik yang ingin membeli pakaian harian seperti daster dengan harga terjangkau.
- Pembeli dari rekomendasi teman ke teman.
- Pembeli yang terbiasa transaksi lewat WhatsApp.
- Pembeli yang ingin melihat foto, ukuran, kondisi, dan harga tanpa proses checkout rumit.

### Admin Harumi Store

- Pemilik/admin toko yang mengelola katalog.
- Membutuhkan input produk cepat.
- Membutuhkan laporan sederhana untuk melihat keuntungan.
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
  - Tombol "Chat Admin".
- Tombol chat mengarah ke WhatsApp admin dengan pesan otomatis.

### Dashboard Admin

- Login admin.
- Ringkasan performa:
  - Total produk aktif.
  - Produk habis.
  - Total gross revenue.
  - Total net profit.
  - Jumlah penjualan bulan ini.
  - Jumlah klik WhatsApp.
- CRUD produk.
- Upload foto produk.
- Kelola size dan stok.
- Kelola HPP dan harga jual.
- Input penjualan manual setelah transaksi WhatsApp selesai.
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
6. Pembeli klik "Chat Admin".
7. Aplikasi membuka WhatsApp dengan pesan otomatis.
8. Transaksi dilanjutkan manual di WhatsApp.

Contoh pesan WhatsApp:

```text
Halo Admin Harumi Store, saya tertarik dengan produk ini:

Produk: Daster Sakura Rayon
Kategori: Daster
Size: L
Harga: Rp65.000
Link: https://harumistore.com/products/daster-sakura-rayon

Apakah produk ini masih tersedia?
```

### Flow Admin

1. Admin login ke dashboard.
2. Admin menambahkan produk baru.
3. Admin mengisi foto, nama, kategori, size, deskripsi, HPP, harga jual, dan stok.
4. Produk tampil di katalog jika status aktif.
5. Ketika transaksi WhatsApp berhasil, admin input data penjualan.
6. Dashboard memperbarui laporan revenue dan net profit.

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

### Admin Product Management

| ID | Requirement | Priority |
| --- | --- | --- |
| ADM-001 | Admin bisa login | Must |
| ADM-002 | Admin bisa tambah produk | Must |
| ADM-003 | Admin bisa edit produk | Must |
| ADM-004 | Admin bisa arsip/nonaktifkan produk | Must |
| ADM-005 | Admin bisa upload foto | Must |
| ADM-006 | Admin bisa mengelola size, stok, HPP, dan harga jual | Must |

### Sales Report

| ID | Requirement | Priority |
| --- | --- | --- |
| REP-001 | Admin bisa input penjualan manual | Must |
| REP-002 | Sistem menghitung gross revenue | Must |
| REP-003 | Sistem menghitung net profit | Must |
| REP-004 | Filter laporan berdasarkan tanggal | Must |
| REP-005 | Filter laporan berdasarkan kategori | Should |
| REP-006 | Export CSV | Should |

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

### Sales

- Tanggal transaksi.
- Pembeli opsional.
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
- Waktu klik.
- Source/referrer opsional.

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
- Supabase Database/PostgreSQL untuk data produk dan penjualan.
- Supabase Storage untuk foto produk.
- Supabase Row Level Security untuk keamanan data.
- Supabase client langsung dari Next.js.

Catatan: aplikasi ini "backendless" dalam arti tidak membutuhkan custom backend server. Next.js tetap digunakan untuk frontend, SSR/SSG, dan routing. Operasi data dilakukan ke Supabase dengan RLS.

### Deployment

- Vercel untuk Next.js.
- Supabase hosted project.
- Domain custom: contoh `harumistore.com`.

## 11. Information Architecture

### Public Pages

- `/` - katalog utama.
- `/products/[slug]` - detail produk.
- `/category/daster` - katalog kategori daster.
- `/category/sepatu-thrifting` - katalog kategori sepatu thrifting.

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
  sku text,
  stock int not null default 0,
  hpp numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `sales`

```sql
create table sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default current_date,
  customer_name text,
  customer_phone text,
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

### `wa_click_events`

```sql
create table wa_click_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
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

- Public boleh insert ke `wa_click_events` untuk tracking klik WhatsApp.

### Admin Full Access

- User yang login sebagai admin boleh:
  - insert/update/delete produk.
  - upload gambar.
  - insert/update/delete sales.
  - melihat semua laporan.

Implementasi sederhana MVP:

- Buat satu user admin di Supabase Auth.
- Gunakan policy berbasis `auth.role() = 'authenticated'` untuk admin.
- Jangan expose service role key di frontend.

## 14. UI/UX Requirements

### Public Catalog

- Mobile-first.
- Produk tampil dalam grid 2 kolom di mobile dan 3-4 kolom di desktop.
- Card produk menampilkan foto, nama, size ringkas, harga, dan status stok.
- CTA utama: "Chat Admin".
- Detail produk harus punya foto besar dan informasi lengkap.
- Untuk sepatu thrifting, kondisi barang harus jelas agar mengurangi komplain.

### Dashboard

- Layout sidebar.
- Table produk dengan search dan filter.
- Form produk harus cepat diisi.
- Laporan penjualan memakai table dengan filter tanggal.
- Angka uang memakai format Rupiah.

## 15. Success Metrics

- Jumlah klik WhatsApp per minggu.
- Produk aktif di katalog.
- Jumlah transaksi yang dicatat admin.
- Gross revenue bulanan.
- Net profit bulanan.
- Produk paling sering diklik.
- Produk paling laku.

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

### Milestone 3 - Admin Product Management

- Login admin.
- CRUD produk.
- Upload foto.
- Kelola size, HPP, harga jual, stok.

### Milestone 4 - Sales Report

- Input penjualan manual.
- Dashboard summary.
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
| RLS salah konfigurasi | Data admin bocor | Pisahkan public read dan admin write dengan policy ketat |

## 18. Recommended Build Order

1. Buat schema Supabase dan seed kategori.
2. Setup Next.js project.
3. Buat public catalog dari data dummy.
4. Hubungkan Supabase read.
5. Buat detail produk dan WhatsApp redirect.
6. Buat admin auth.
7. Buat CRUD produk dan upload image.
8. Buat input penjualan.
9. Buat dashboard report.
10. Polish mobile UI dan deploy.

## 19. Acceptance Criteria MVP

- Pembeli bisa membuka katalog tanpa login.
- Pembeli bisa melihat detail produk.
- Pembeli bisa klik produk dan diarahkan ke WhatsApp admin dengan pesan otomatis.
- Admin bisa login.
- Admin bisa menambah, mengedit, dan menonaktifkan produk.
- Admin bisa mengatur size, HPP, harga jual, dan stok.
- Admin bisa input penjualan.
- Dashboard menampilkan gross revenue dan net profit.
- Data produk dan penjualan tersimpan di Supabase.
- Foto produk tersimpan di Supabase Storage.

