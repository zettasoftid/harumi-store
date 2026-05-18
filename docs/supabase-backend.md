# Supabase Backend Harumi Store

Backend project ini memakai Supabase langsung dari aplikasi Vite React:

- Supabase Auth untuk login admin.
- PostgreSQL untuk katalog, variant/size, sales, laporan, settings, dan tracking klik WhatsApp.
- Supabase Storage bucket `product-images` untuk foto produk.
- Row Level Security agar publik hanya bisa membaca katalog aktif dan membuat event klik WhatsApp.

## File Penting

- `supabase/migrations/20260516000000_harumi_store_backend.sql` berisi schema, index, trigger, RLS policy, seed kategori, seed settings, dan bucket storage.
- `.env.local` berisi credential publishable Supabase untuk Vite.
- `src/lib/supabase/client.ts` membuat Supabase client typed.
- `src/lib/supabase/catalog.ts` berisi query katalog publik dan builder URL WhatsApp.
- `src/lib/supabase/products-admin.ts` berisi helper CRUD produk admin.
- `src/lib/supabase/sales.ts` berisi input penjualan manual, laporan, summary, dan export CSV.
- `src/lib/supabase/settings.ts` berisi pengaturan toko seperti nomor WhatsApp admin.
- `src/lib/supabase/storage.ts` berisi mode penyimpanan gambar produk: localStorage untuk testing atau Cloudflare R2 untuk production.

## Penyimpanan Gambar Produk

Gunakan `.env`:

```env
VITE_LOCAL_STORAGE=True
```

Saat `True`, gambar dikirim ke local storage server di port `8081` dan disimpan ke folder `public/uploads`. Ini cocok untuk testing lokal karena semua pengunjung yang membuka server lokal yang sama akan melihat gambar yang sama.

Jalankan dengan:

```bash
./manage.sh start
```

`manage.sh` akan menjalankan:

- Vite di `http://localhost:8080`
- Local image storage di `http://127.0.0.1:8081`

File upload akan tersimpan sebagai path publik seperti:

```text
/uploads/products/nama-produk-123.webp
```

Saat `False`, upload diarahkan ke Cloudflare R2 lewat Worker/upload endpoint:

```env
VITE_LOCAL_STORAGE=False
VITE_R2_UPLOAD_ENDPOINT=https://your-worker.example.workers.dev/upload
VITE_R2_DELETE_ENDPOINT=https://your-worker.example.workers.dev/delete
VITE_R2_PUBLIC_URL=https://pub-your-r2-domain.example.com
```

Kontrak upload endpoint R2:

- Request: `POST multipart/form-data`
- Field: `file`, `path`, `contentType`
- Response JSON minimal salah satu dari:
  - `{ "publicUrl": "https://..." }`
  - `{ "url": "https://..." }`
  - `{ "key": "products/nama-file.webp" }`
  - `{ "path": "products/nama-file.webp" }`

## Cara Apply Schema

Jalankan SQL di Supabase Dashboard:

1. Buka project Supabase.
2. Masuk ke **SQL Editor**.
3. Paste isi `supabase/migrations/20260516000000_harumi_store_backend.sql`.
4. Klik **Run**.

Setelah itu:

1. Buka **Authentication > Providers > Phone** lalu aktifkan phone auth dan provider SMS yang dipakai.
2. Buka **Authentication > Users** dan buat satu user admin dengan nomor HP.
3. Login admin tersedia di `/admin/login`.
4. Buka table `store_settings`.
5. Isi `admin_whatsapp` dengan nomor format internasional, contoh `6281234567890`.

## Contoh Pemakaian

```ts
import { buildWhatsAppProductUrl, getActiveProducts, getStoreSettings } from '@/lib/supabase'

const products = await getActiveProducts({ categorySlug: 'daster', search: 'rayon' })
const settings = await getStoreSettings()

const url = buildWhatsAppProductUrl({
  adminWhatsapp: settings?.admin_whatsapp ?? '',
  product: products[0],
})
```

```ts
import { createSale } from '@/lib/supabase'

await createSale({
  customer_name: 'Siti',
  items: [
    {
      product_id: 'product-id',
      variant_id: 'variant-id',
      qty: 1,
    },
  ],
  other_cost: 0,
})
```

## Catatan RLS

Policy MVP saat ini menganggap semua user Supabase Auth yang berhasil login adalah admin. Jangan aktifkan self-signup publik untuk project ini, atau batasi signup di Supabase Dashboard.
