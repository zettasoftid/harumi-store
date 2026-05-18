import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { ArrowLeft, GripVertical, ImagePlus, Plus, Save, Trash2, UploadCloud } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createProduct, getAdminProductById, getCategories, getProductImageUrl, slugify, updateProduct, uploadProductImage } from '@/lib/supabase'
import { useAdminAccess } from '@/hooks/use-admin-access'

type CategoryOption = {
  id: string
  name: string
  slug: string
}

type VariantForm = {
  color: string
  hpp: string
  is_active: boolean
  selling_price: string
  size: string
  sku: string
  stock: string
}

type ProductImageForm = {
  alt_text?: string | null
  image_path: string
  is_primary: boolean
  preview_url?: string
  sort_order: number
}

const emptyVariant: VariantForm = {
  color: '',
  hpp: '0',
  is_active: true,
  selling_price: '0',
  size: '',
  sku: '',
  stock: '0',
}

const fallbackCategories: CategoryOption[] = [
  { id: 'daster', name: 'Daster', slug: 'daster' },
  { id: 'sepatu-thrifting', name: 'Sepatu Thrifting', slug: 'sepatu-thrifting' },
]

export default function AdminProductForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { isAllowed, isLoading, testBypass } = useAdminAccess()

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [conditionNote, setConditionNote] = useState('')
  const [description, setDescription] = useState('')
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [images, setImages] = useState<ProductImageForm[]>([])
  const [isActive, setIsActive] = useState(true)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [variants, setVariants] = useState<VariantForm[]>([{ ...emptyVariant }])

  useEffect(() => {
    if (!isAllowed) return

    getCategories()
      .then((data) => {
        const rows = data.length > 0 ? data : fallbackCategories
        setCategories(rows)
        setCategoryId((current) => current || rows[0]?.id || '')
      })
      .catch(() => {
        setCategories(fallbackCategories)
        setCategoryId((current) => current || fallbackCategories[0].id)
      })
  }, [isAllowed])

  useEffect(() => {
    if (!isAllowed || !id) return

    getAdminProductById(id)
      .then((product) => {
        if (!product) return
        setCategoryId(product.category_id)
        setConditionNote(product.condition_note ?? '')
        setDescription(product.description)
        setImages(
          (product.product_images ?? [])
            .sort((first, second) => first.sort_order - second.sort_order)
            .map((image, index) => ({
              alt_text: image.alt_text,
              image_path: image.image_path,
              is_primary: image.is_primary || index === 0,
              sort_order: index,
            })),
        )
        setIsActive(product.is_active)
        setName(product.name)
        setSlug(product.slug)
        setVariants(
          product.product_variants && product.product_variants.length > 0
            ? product.product_variants.map((variant) => ({
                color: variant.color ?? '',
                hpp: String(variant.hpp),
                is_active: variant.is_active,
                selling_price: String(variant.selling_price),
                size: variant.size,
                sku: variant.sku ?? '',
                stock: String(variant.stock),
              }))
            : [{ ...emptyVariant }],
        )
      })
      .catch((error) => setSubmitError(error instanceof Error ? error.message : 'Gagal memuat produk.'))
  }, [id, isAllowed])

  function updateVariant(index: number, field: keyof VariantForm, value: string | boolean) {
    setVariants((current) =>
      current.map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, [field]: value } : variant
      )),
    )
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError('')
    setMessage('')

    if (!name.trim() || !categoryId || !description.trim()) {
      setSubmitError('Nama produk, kategori, dan deskripsi wajib diisi.')
      return
    }

    const cleanVariants = variants
      .filter((variant) => variant.size.trim())
      .map((variant) => ({
        color: variant.color.trim() || null,
        hpp: Number(variant.hpp) || 0,
        is_active: variant.is_active,
        selling_price: Number(variant.selling_price) || 0,
        size: variant.size.trim(),
        sku: variant.sku.trim() || null,
        stock: Number(variant.stock) || 0,
      }))

    if (cleanVariants.length === 0) {
      setSubmitError('Minimal satu size/variant wajib diisi.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        category_id: categoryId,
        condition_note: conditionNote.trim() || null,
        description: description.trim(),
        images: images.map((image, index) => ({
          alt_text: image.alt_text || name,
          image_path: image.image_path,
          is_primary: index === 0,
          sort_order: index,
        })),
        is_active: isActive,
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        variants: cleanVariants,
      }

      if (id) {
        await updateProduct(id, {
          ...payload,
          replaceImages: true,
          replaceVariants: true,
        })
        setMessage('Produk berhasil diperbarui.')
      } else {
        await createProduct(payload)
        setMessage('Produk berhasil ditambahkan.')
        navigate('/admin/products')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Gagal menyimpan produk.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUploadImages(files: FileList | File[]) {
    const fileList = Array.from(files)
    if (fileList.length === 0) return

    setUploadingImage(true)
    setSubmitError('')

    try {
      const uploadedImages = await Promise.all(
        fileList.map(async (file, index) => {
          const extension = file.name.split('.').pop() || 'webp'
          const path = `products/${slugify(name || file.name)}-${Date.now()}-${index}.${extension}`
          const uploadedPath = await uploadProductImage(file, path)

          return {
            alt_text: name || file.name,
            image_path: uploadedPath,
            is_primary: false,
            preview_url: URL.createObjectURL(file),
            sort_order: 0,
          }
        }),
      )

      setImages((current) => (
        [...current, ...uploadedImages].map((image, index) => ({
          ...image,
          is_primary: index === 0,
          sort_order: index,
        }))
      ))
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Gagal upload foto produk.')
    } finally {
      setUploadingImage(false)
    }
  }

  function addImagePath(path: string) {
    const cleanPath = path.trim()
    if (!cleanPath) return

    setImages((current) => (
      [...current, {
        alt_text: name,
        image_path: cleanPath,
        is_primary: current.length === 0,
        sort_order: current.length,
      }]
    ))
  }

  function reorderImage(fromIndex: number, toIndex: number) {
    setImages((current) => {
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      if (!moved) return current
      next.splice(toIndex, 0, moved)

      return next.map((image, index) => ({
        ...image,
        is_primary: index === 0,
        sort_order: index,
      }))
    })
  }

  function removeImage(index: number) {
    setImages((current) => (
      current
        .filter((_, imageIndex) => imageIndex !== index)
        .map((image, imageIndex) => ({
          ...image,
          is_primary: imageIndex === 0,
          sort_order: imageIndex,
        }))
    ))
  }

  function applyShoeSpecificationExample() {
    setDescription([
      'Spesifikasi',
      'Bahan upper kombinasi suede PU',
      'Outsol menggunakan rubber ringan (tidak licin)',
      'Unisex',
      'Tipe pengikat tali',
      'Size 37-44',
      'Hpp 380',
      'Jual 430',
    ].join('\n'))
    setVariants(
      Array.from({ length: 8 }, (_, index) => ({
        ...emptyVariant,
        color: 'Hitam',
        hpp: '380000',
        selling_price: '430000',
        size: String(37 + index),
        stock: '1',
      })),
    )
  }

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-cream font-body text-sm text-moss">Memuat form...</main>
  }

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <AdminLayout
      title={isEditing ? 'Edit Produk' : 'Tambah Produk'}
      description="Isi foto, nama, kategori, size, stok, HPP, harga jual, dan kondisi barang sesuai PRD."
      testBypass={testBypass}
      action={
        <Button asChild variant="outline" className="rounded-lg border-rose/20 text-rose hover:bg-clay/20">
          <Link to="/admin/products">
            <ArrowLeft />
            Katalog
          </Link>
        </Button>
      }
    >
      <form className="grid gap-5 xl:grid-cols-[1fr_420px]" onSubmit={handleSubmit}>
        <section className="space-y-5 rounded-lg border border-rose/10 bg-white p-5 shadow-card">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nama produk</Label>
              <Input id="product-name" value={name} onChange={(event) => setName(event.target.value)} className="h-11 rounded-lg border-rose/15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-slug">Slug</Label>
              <Input id="product-slug" value={slug} onChange={(event) => setSlug(slugify(event.target.value))} placeholder={slugify(name)} className="h-11 rounded-lg border-rose/15" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-category">Kategori</Label>
              <select
                id="product-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-11 w-full rounded-lg border border-rose/15 bg-white px-3 font-body text-sm outline-none focus:border-rose"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label>Gambar produk</Label>
                <p className="mt-1 font-body text-xs text-moss">Bisa upload lebih dari satu, drag untuk ubah urutan. Gambar pertama jadi foto utama.</p>
              </div>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-rose/20 px-4 font-body text-sm font-bold text-rose hover:bg-clay/20">
                <ImagePlus size={16} />
                Pilih gambar
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    if (event.target.files) handleUploadImages(event.target.files)
                    event.target.value = ''
                  }}
                />
              </label>
            </div>

            <div
              className="rounded-lg border-2 border-dashed border-rose/20 bg-cream/60 p-5 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                handleUploadImages(event.dataTransfer.files)
              }}
            >
              <UploadCloud className="mx-auto text-rose" size={28} />
              <p className="mt-2 font-body text-sm font-bold text-soil">Drag & drop gambar ke sini</p>
              <p className="mt-1 font-body text-xs text-moss">{uploadingImage ? 'Mengupload gambar...' : 'PNG, JPG, atau WEBP. Maksimum mengikuti setting bucket Supabase.'}</p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Atau paste path/URL gambar lalu tekan Enter"
                className="h-11 rounded-lg border-rose/15"
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  addImagePath(event.currentTarget.value)
                  event.currentTarget.value = ''
                }}
              />
            </div>

            {images.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image, index) => (
                  <div
                    key={`${image.image_path}-${index}`}
                    draggable
                    onDragStart={() => setDraggedImageIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedImageIndex === null) return
                      reorderImage(draggedImageIndex, index)
                      setDraggedImageIndex(null)
                    }}
                    className="rounded-lg border border-rose/10 bg-white p-3 shadow-xs"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 font-body text-xs font-bold text-moss">
                        <GripVertical size={14} />
                        {index === 0 ? 'Foto utama' : `Foto ${index + 1}`}
                      </span>
                      <Button type="button" size="icon-sm" variant="outline" className="border-rose/20 text-rose" onClick={() => removeImage(index)} aria-label="Hapus gambar">
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="aspect-[4/3] overflow-hidden rounded-md bg-cream">
                      <img
                        src={image.preview_url ?? getProductImageUrl(image.image_path) ?? '/images/products/peppermint-mints.png'}
                        alt={image.alt_text ?? name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          const fallback = getProductImageUrl(image.image_path)
                          if (fallback && event.currentTarget.src !== fallback) {
                            event.currentTarget.src = fallback
                            return
                          }
                          event.currentTarget.src = '/images/products/peppermint-mints.png'
                        }}
                      />
                    </div>
                    <p className="mt-2 truncate font-body text-xs text-moss">{image.image_path}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="product-description">Spesifikasi / deskripsi lengkap</Label>
              <Button type="button" size="sm" variant="outline" className="border-rose/20 text-rose" onClick={applyShoeSpecificationExample}>
                Isi contoh sepatu
              </Button>
            </div>
            <textarea
              id="product-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={'Spesifikasi\nBahan upper kombinasi suede PU\nOutsol menggunakan rubber ringan (tidak licin)\nUnisex\nTipe pengikat tali\nSize 37-44\nHpp 380\nJual 430'}
              className="min-h-32 w-full rounded-lg border border-rose/15 bg-white px-3 py-3 font-body text-sm outline-none focus:border-rose"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition-note">Kondisi/catatan khusus</Label>
            <textarea
              id="condition-note"
              value={conditionNote}
              onChange={(event) => setConditionNote(event.target.value)}
              placeholder="Wajib jelas untuk sepatu thrifting."
              className="min-h-24 w-full rounded-lg border border-rose/15 bg-white px-3 py-3 font-body text-sm outline-none focus:border-rose"
            />
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-body text-sm font-extrabold uppercase tracking-widest">Size & Stok</h3>
              <Button type="button" size="sm" variant="outline" className="border-rose/20 text-rose" onClick={() => setVariants((current) => [...current, { ...emptyVariant }])}>
                <Plus />
                Variant
              </Button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="rounded-lg bg-cream p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="font-body text-[11px] font-bold uppercase tracking-widest text-moss">Size</span>
                      <Input value={variant.size} onChange={(event) => updateVariant(index, 'size', event.target.value)} placeholder="Contoh: 37 / L" className="rounded-lg bg-white" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-body text-[11px] font-bold uppercase tracking-widest text-moss">Warna</span>
                      <Input value={variant.color} onChange={(event) => updateVariant(index, 'color', event.target.value)} placeholder="Contoh: Hitam" className="rounded-lg bg-white" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-body text-[11px] font-bold uppercase tracking-widest text-moss">Stok</span>
                      <Input value={variant.stock} onChange={(event) => updateVariant(index, 'stock', event.target.value)} inputMode="numeric" placeholder="Contoh: 12" className="rounded-lg bg-white" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-body text-[11px] font-bold uppercase tracking-widest text-moss">HPP</span>
                      <Input value={variant.hpp} onChange={(event) => updateVariant(index, 'hpp', event.target.value)} inputMode="numeric" placeholder="Contoh: 380000" className="rounded-lg bg-white" />
                    </label>
                    <label className="col-span-2 space-y-1">
                      <span className="font-body text-[11px] font-bold uppercase tracking-widest text-moss">Harga Jual</span>
                      <Input value={variant.selling_price} onChange={(event) => updateVariant(index, 'selling_price', event.target.value)} inputMode="numeric" placeholder="Contoh: 430000" className="rounded-lg bg-white" />
                    </label>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Input value={variant.sku} onChange={(event) => updateVariant(index, 'sku', event.target.value)} placeholder="SKU opsional" className="rounded-lg bg-white" />
                    {variants.length > 1 && (
                      <Button type="button" size="icon" variant="outline" className="border-rose/20 text-rose" onClick={() => removeVariant(index)} aria-label="Hapus variant">
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
            <label className="flex items-center justify-between gap-4 font-body text-sm font-bold">
              Produk aktif di katalog
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="size-5 accent-[#B94763]" />
            </label>
            {submitError && <p className="mt-4 rounded-lg bg-rose/10 px-3 py-2 font-body text-sm text-rose">{submitError}</p>}
            {message && <p className="mt-4 rounded-lg bg-moss/10 px-3 py-2 font-body text-sm text-soil">{message}</p>}
            <Button type="submit" className="mt-5 h-11 w-full rounded-lg bg-rose text-cream hover:bg-rose/90" disabled={submitting}>
              <Save />
              {submitting ? 'Menyimpan...' : 'Simpan Produk'}
            </Button>
          </section>
        </aside>
      </form>
    </AdminLayout>
  )
}
