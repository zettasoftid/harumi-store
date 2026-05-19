import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Loader2, LogOut, MessageCircle, Minus, Plus, ShoppingBag, UserRound } from 'lucide-react'

import {
  buildCheckoutWhatsAppUrl,
  formatRupiah,
  getProductTotalStock,
  type CheckoutProduct,
} from '@/lib/checkout'
import { getStoreSettings } from '@/lib/supabase/settings'
import { createCheckoutIntent, recordCheckoutWhatsAppClick } from '@/lib/supabase/checkout-intents'
import {
  getCurrentCustomer,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateCustomerProfile,
  type CustomerProfile,
} from '@/lib/supabase/customer-auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const DEFAULT_ADMIN_WHATSAPP = '6281339691260'

type CheckoutDialogProps = {
  buttonClassName?: string
  buttonLabel?: string
  product: CheckoutProduct
  source?: string
}

type AuthMode = 'login' | 'register'

const initialAuthForm = {
  address: '',
  name: '',
  password: '',
  phone: '',
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function CheckoutDialog({ buttonClassName, buttonLabel = 'Checkout', product, source = 'catalog' }: CheckoutDialogProps) {
  const firstVariant = product.variants[0]
  const [open, setOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState(firstVariant?.size ?? '')
  const [selectedColor, setSelectedColor] = useState(firstVariant?.color ?? '')
  const [quantity, setQuantity] = useState(1)
  const [authError, setAuthError] = useState('')
  const [authForm, setAuthForm] = useState(initialAuthForm)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [checkoutError, setCheckoutError] = useState('')
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState('')
  const [adminWhatsapp, setAdminWhatsapp] = useState(DEFAULT_ADMIN_WHATSAPP)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const sizes = useMemo(() => uniqueValues(product.variants.map((variant) => variant.size)), [product.variants])
  const colors = useMemo(
    () => uniqueValues(product.variants.filter((variant) => variant.size === selectedSize).map((variant) => variant.color)),
    [product.variants, selectedSize],
  )
  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.size === selectedSize && variant.color === selectedColor) ?? firstVariant,
    [firstVariant, product.variants, selectedColor, selectedSize],
  )

  const isPreOrder = (selectedVariant?.stock ?? 0) <= 0
  const totalStock = getProductTotalStock(product)
  const maxReadyQuantity = selectedVariant?.stock && selectedVariant.stock > 0 ? selectedVariant.stock : 99

  useEffect(() => {
    if (!open) return

    getStoreSettings()
      .then((settings) => {
        if (settings?.admin_whatsapp) setAdminWhatsapp(settings.admin_whatsapp)
      })
      .catch(() => {
        setAdminWhatsapp(DEFAULT_ADMIN_WHATSAPP)
      })
  }, [open])

  useEffect(() => {
    if (!open) return

    let isActive = true

    getCurrentCustomer()
      .then((profile) => {
        if (!isActive) return
        setCustomer(profile)
        if (profile) {
          setCustomerName(profile.name)
          setCustomerPhone(profile.phone)
          setAddress(profile.address)
        }
      })
      .catch(() => {
        if (!isActive) return
        setCustomer(null)
      })
      .finally(() => {
        if (isActive) setIsCheckingCustomer(false)
      })

    return () => {
      isActive = false
    }
  }, [open])

  const applyCustomer = (profile: CustomerProfile) => {
    setCustomer(profile)
    setCustomerName(profile.name)
    setCustomerPhone(profile.phone)
    setAddress(profile.address)
    setAuthForm(initialAuthForm)
    setAuthError('')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (nextOpen) {
      setIsCheckingCustomer(true)
      setAuthError('')
      setCheckoutError('')
    }
  }

  const handleSizeChange = (size: string) => {
    const nextVariant = product.variants.find((variant) => variant.size === size)
    setSelectedSize(size)
    setSelectedColor(nextVariant?.color ?? '')
    setQuantity(1)
  }

  const handleQuantityChange = (nextQuantity: number) => {
    const cleanQuantity = Number.isFinite(nextQuantity) ? nextQuantity : 1
    setQuantity(Math.min(Math.max(cleanQuantity, 1), maxReadyQuantity))
  }

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')

    if (authMode === 'register' && (!authForm.name.trim() || !authForm.address.trim())) {
      setAuthError('Nama dan alamat wajib diisi untuk membuat akun.')
      return
    }

    if (!authForm.phone.trim() || authForm.password.length < 6) {
      setAuthError('Nomor HP wajib diisi dan password minimal 6 karakter.')
      return
    }

    setIsAuthLoading(true)

    try {
      const profile = authMode === 'register'
        ? await registerCustomer(authForm)
        : await loginCustomer({ password: authForm.password, phone: authForm.phone })

      applyCustomer(profile)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Akun customer gagal diproses.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    setCheckoutError('')
    await logoutCustomer().catch(() => undefined)
    setCustomer(null)
    setCustomerName('')
    setCustomerPhone('')
    setAddress('')
    setAuthMode('login')
  }

  const handleCheckout = async () => {
    if (!selectedVariant) return
    setCheckoutError('')

    if (!customer) {
      setCheckoutError('Silakan masuk atau daftar akun customer sebelum checkout.')
      return
    }

    if (!customerName.trim() || !address.trim()) {
      setCheckoutError('Nama dan alamat wajib diisi agar detail order lengkap di WhatsApp.')
      return
    }

    setIsCheckingOut(true)

    try {
      const latestCustomer = await updateCustomerProfile({
        address: address.trim(),
        name: customerName.trim(),
      })
      applyCustomer(latestCustomer)

      const checkoutIntent = await createCheckoutIntent({
        customer_id: latestCustomer.id,
        product_id: product.id,
        qty: quantity,
        source,
        stock_status: isPreOrder ? 'po' : 'ready',
        unit_price: selectedVariant.price,
        variant_id: selectedVariant.id,
      })

      await recordCheckoutWhatsAppClick({
        checkout_intent_id: checkoutIntent.id,
        customer_id: latestCustomer.id,
        product_id: product.id,
        source,
        variant_id: selectedVariant.id,
      })

      const url = buildCheckoutWhatsAppUrl({
        address: latestCustomer.address,
        adminWhatsapp,
        customerName: latestCustomer.name,
        customerPhone: latestCustomer.phone,
        product,
        productUrl: window.location.href,
        quantity,
        variant: selectedVariant,
      })

      window.open(url, '_blank', 'noopener,noreferrer')
      setOpen(false)
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Checkout gagal diproses.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className={buttonClassName}>
          <ShoppingBag size={13} />
          {buttonLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-rose/15 bg-cream p-0 sm:max-w-2xl">
        <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-white p-5">
            <div className="flex h-64 items-center justify-center rounded-xl bg-[#f0ede8] p-5">
              <img src={product.image} alt={product.name} className="max-h-52 w-auto object-contain" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-moss/15 px-3 py-1 font-body text-[10px] font-bold uppercase tracking-widest text-soil">
                {product.vendor}
              </span>
              <span className={cn(
                'rounded-full px-3 py-1 font-body text-[10px] font-bold uppercase tracking-widest',
                totalStock > 0 ? 'bg-clay/25 text-rose' : 'bg-rose text-cream',
              )}>
                {totalStock > 0 ? `${totalStock} stok ready` : 'Bisa PO'}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="pr-8 font-display text-2xl font-extrabold uppercase tracking-wide text-soil">
                Checkout
              </DialogTitle>
              <DialogDescription className="font-body text-sm leading-relaxed text-moss">
                Pilih varian, masuk akun customer, lalu alamat ikut terkirim ke WhatsApp admin.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5">
              <p className="font-body text-[10px] font-bold uppercase tracking-widest text-moss">{product.vendor}</p>
              <h3 className="mt-1 font-body text-lg font-bold leading-snug text-soil">{product.name}</h3>
              <p className="mt-1 font-body text-sm font-bold text-rose">
                {selectedVariant ? formatRupiah(selectedVariant.price) : 'Harga belum tersedia'}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <Label className="font-body text-xs font-bold uppercase tracking-widest text-soil">Size</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={cn(
                        'h-9 min-w-12 rounded-full border px-4 font-body text-xs font-bold transition-all',
                        selectedSize === size
                          ? 'border-rose bg-rose text-cream'
                          : 'border-rose/20 bg-white text-soil hover:border-rose',
                      )}
                      onClick={() => handleSizeChange(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-body text-xs font-bold uppercase tracking-widest text-soil">Warna</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        'rounded-full border px-4 py-2 font-body text-xs font-bold transition-all',
                        selectedColor === color
                          ? 'border-rose bg-clay/40 text-soil'
                          : 'border-rose/20 bg-white text-soil hover:border-rose',
                      )}
                      onClick={() => {
                        setSelectedColor(color)
                        setQuantity(1)
                      }}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-rose/15 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-body text-xs font-bold text-soil">Status varian</p>
                    <p className="font-body text-xs text-moss">
                      {isPreOrder ? 'Stok habis, pesanan akan dicatat sebagai PO.' : `Ready ${selectedVariant?.stock ?? 0} pcs.`}
                    </p>
                  </div>
                  <span className={cn(
                    'rounded-full px-3 py-1 font-body text-[10px] font-bold uppercase tracking-widest',
                    isPreOrder ? 'bg-rose text-cream' : 'bg-moss/15 text-soil',
                  )}>
                    {isPreOrder ? 'PO' : 'Ready'}
                  </span>
                </div>
              </div>

              <div>
                <Label className="font-body text-xs font-bold uppercase tracking-widest text-soil">Qty</Label>
                <div className="mt-2 flex w-36 items-center rounded-full border border-rose/20 bg-white p-1">
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full text-rose hover:bg-clay/20" onClick={() => handleQuantityChange(quantity - 1)} aria-label="Kurangi qty">
                    <Minus size={14} />
                  </button>
                  <Input
                    value={quantity}
                    onChange={(event) => handleQuantityChange(Number(event.target.value))}
                    className="h-8 border-0 bg-transparent p-0 text-center font-body text-sm font-bold shadow-none focus-visible:ring-0"
                    inputMode="numeric"
                  />
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full text-rose hover:bg-clay/20" onClick={() => handleQuantityChange(quantity + 1)} aria-label="Tambah qty">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {isCheckingCustomer ? (
                <div className="rounded-xl border border-rose/15 bg-white p-4 font-body text-sm text-moss">
                  Memeriksa akun customer...
                </div>
              ) : customer ? (
                <div className="rounded-xl border border-rose/15 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-clay/25 text-rose">
                        <UserRound size={17} />
                      </div>
                      <div>
                        <p className="font-body text-xs font-bold uppercase tracking-widest text-moss">Akun customer</p>
                        <p className="font-body text-sm font-extrabold text-soil">{customer.phone}</p>
                      </div>
                    </div>
                    <button type="button" className="text-rose hover:text-soil" onClick={handleLogout} aria-label="Keluar akun customer">
                      <LogOut size={17} />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`${product.id}-name`} className="font-body text-xs text-soil">Nama</Label>
                      <Input id={`${product.id}-name`} value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-2 rounded-lg bg-cream" placeholder="Nama penerima" />
                    </div>
                    <div>
                      <Label htmlFor={`${product.id}-phone`} className="font-body text-xs text-soil">No. HP</Label>
                      <Input id={`${product.id}-phone`} value={customerPhone} className="mt-2 rounded-lg bg-cream" inputMode="tel" readOnly />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label htmlFor={`${product.id}-address`} className="font-body text-xs text-soil">Alamat pengiriman</Label>
                    <Textarea id={`${product.id}-address`} value={address} onChange={(event) => setAddress(event.target.value)} className="mt-2 min-h-20 rounded-lg bg-cream" placeholder="Alamat lengkap untuk dikirim ke WhatsApp admin" />
                  </div>
                </div>
              ) : (
                <form className="rounded-xl border border-rose/15 bg-white p-4" onSubmit={handleAuthSubmit}>
                  <div className="mb-4 grid grid-cols-2 rounded-full bg-cream p-1">
                    {(['login', 'register'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={cn(
                          'h-9 rounded-full font-body text-xs font-extrabold uppercase tracking-widest transition-all',
                          authMode === mode ? 'bg-rose text-cream shadow-sm' : 'text-moss hover:text-soil',
                        )}
                        onClick={() => {
                          setAuthMode(mode)
                          setAuthError('')
                        }}
                      >
                        {mode === 'login' ? 'Masuk' : 'Daftar'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {authMode === 'register' && (
                      <div>
                        <Label htmlFor={`${product.id}-auth-name`} className="font-body text-xs text-soil">Nama</Label>
                        <Input id={`${product.id}-auth-name`} value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 rounded-lg bg-cream" placeholder="Nama lengkap" />
                      </div>
                    )}
                    <div>
                      <Label htmlFor={`${product.id}-auth-phone`} className="font-body text-xs text-soil">No. HP</Label>
                      <Input id={`${product.id}-auth-phone`} value={authForm.phone} onChange={(event) => setAuthForm((current) => ({ ...current, phone: event.target.value }))} className="mt-2 rounded-lg bg-cream" placeholder="0812..." inputMode="tel" />
                    </div>
                    <div>
                      <Label htmlFor={`${product.id}-auth-password`} className="font-body text-xs text-soil">Password</Label>
                      <Input id={`${product.id}-auth-password`} value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} className="mt-2 rounded-lg bg-cream" placeholder="Minimal 6 karakter" type="password" />
                    </div>
                    {authMode === 'register' && (
                      <div>
                        <Label htmlFor={`${product.id}-auth-address`} className="font-body text-xs text-soil">Alamat</Label>
                        <Textarea id={`${product.id}-auth-address`} value={authForm.address} onChange={(event) => setAuthForm((current) => ({ ...current, address: event.target.value }))} className="mt-2 min-h-20 rounded-lg bg-cream" placeholder="Alamat lengkap untuk checkout WhatsApp" />
                      </div>
                    )}
                  </div>

                  {authError && <p className="mt-3 rounded-lg bg-rose/10 px-3 py-2 font-body text-xs text-rose">{authError}</p>}

                  <Button type="submit" className="mt-4 h-11 w-full rounded-full bg-soil font-body text-xs font-bold uppercase tracking-widest text-cream hover:bg-soil/90" disabled={isAuthLoading}>
                    {isAuthLoading ? <Loader2 className="animate-spin" /> : <UserRound size={16} />}
                    {authMode === 'login' ? 'Masuk Akun' : 'Buat Akun'}
                  </Button>
                </form>
              )}
            </div>

            {checkoutError && <p className="mt-4 rounded-lg bg-rose/10 px-3 py-2 font-body text-sm text-rose">{checkoutError}</p>}

            <Button type="button" className="mt-5 h-12 w-full rounded-full bg-rose font-body text-xs font-bold uppercase tracking-widest text-cream hover:bg-rose/90" onClick={handleCheckout} disabled={isCheckingOut || isCheckingCustomer}>
              {isCheckingOut ? <Loader2 className="animate-spin" /> : <MessageCircle size={16} />}
              Checkout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
