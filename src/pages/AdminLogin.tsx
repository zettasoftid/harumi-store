import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, Loader2, LockKeyhole, MessageCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  enableAdminTestBypass,
  getCurrentSession,
  hasAdminTestBypass,
  isAdminTestBypassPhone,
  isCurrentUserAdmin,
  normalizeIndonesianPhone,
  sendAdminPhoneOtp,
  verifyAdminPhoneOtp,
} from '@/lib/supabase'

type LoginStep = 'phone' | 'otp'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState<LoginStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const normalizedPhone = useMemo(() => {
    if (!phone.trim()) return ''
    return normalizeIndonesianPhone(phone)
  }, [phone])

  useEffect(() => {
    if (hasAdminTestBypass()) {
      navigate('/admin', { replace: true })
      return
    }

    getCurrentSession()
      .then(async (session) => {
        if (session && (await isCurrentUserAdmin())) navigate('/admin', { replace: true })
      })
      .catch(() => undefined)
  }, [navigate])

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (phone.trim().length < 8) {
      setError('Masukkan nomor HP admin yang valid.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isAdminTestBypassPhone(phone) && enableAdminTestBypass(phone)) {
        navigate('/admin', { replace: true })
        return
      }

      const result = await sendAdminPhoneOtp(phone)
      setPhone(result.phone)
      setStep('otp')
      setMessage(`Kode OTP dikirim ke ${result.phone}.`)
    } catch (otpError) {
      setError(otpError instanceof Error ? otpError.message : 'Gagal mengirim kode OTP.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (otp.trim().length < 4) {
      setError('Masukkan kode OTP yang diterima.')
      return
    }

    setIsSubmitting(true)

    try {
      await verifyAdminPhoneOtp(phone, otp.trim())
      navigate('/admin', { replace: true })
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Kode OTP tidak valid.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-cream text-soil">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="relative hidden overflow-hidden bg-soil lg:block">
          <img
            src="/images/hero-wellness-bg.jpg"
            alt="Harumi Store admin"
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-soil/80 via-soil/55 to-rose/40" />
          <div className="absolute inset-0 flex flex-col justify-end p-14 text-cream">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-clay">Dashboard Admin</p>
            <h1 className="mt-4 max-w-xl font-display text-5xl font-black uppercase leading-none tracking-wide">
              Harumi Store
            </h1>
            <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-cream/80">
              Kelola katalog daster, sepatu thrifting, stok, HPP, harga jual, dan laporan penjualan dari satu tempat.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <Link to="/" className="inline-flex items-center gap-2 font-body text-sm font-bold text-rose hover:text-soil">
              <ArrowLeft size={16} />
              Kembali ke katalog
            </Link>

            <div className="mt-10 rounded-lg border border-rose/15 bg-white p-6 shadow-card sm:p-8">
              <div className="mb-8">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-clay/30 text-rose">
                  <LockKeyhole size={22} />
                </div>
                <h2 className="font-display text-3xl font-extrabold uppercase tracking-wide text-soil">Login Admin</h2>
                <p className="mt-2 font-body text-sm leading-relaxed text-moss">
                  Masuk memakai nomor HP admin. Kode OTP akan dikirim melalui konfigurasi Phone Auth Supabase.
                </p>
              </div>

              {step === 'phone' ? (
                <form className="space-y-5" onSubmit={handleSendOtp}>
                  <div className="space-y-2">
                    <Label htmlFor="admin-phone">Nomor HP</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss" />
                      <Input
                        id="admin-phone"
                        inputMode="tel"
                        placeholder="0812 3456 7890"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="h-12 rounded-lg border-rose/20 pl-10 focus-visible:border-rose"
                      />
                    </div>
                    {normalizedPhone && (
                      <p className="font-body text-xs text-moss">
                        Format login: {normalizedPhone}
                        {isAdminTestBypassPhone(normalizedPhone) ? ' - bypass testing aktif di dev' : ''}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="h-12 w-full rounded-lg bg-rose text-cream hover:bg-rose/90" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <MessageCircle />}
                    Kirim Kode OTP
                  </Button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={handleVerifyOtp}>
                  <div className="space-y-2">
                    <Label htmlFor="admin-otp">Kode OTP</Label>
                    <Input
                      id="admin-otp"
                      inputMode="numeric"
                      placeholder="6 digit kode"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-12 rounded-lg border-rose/20 text-center text-lg tracking-widest focus-visible:border-rose"
                    />
                    <p className="font-body text-xs text-moss">Dikirim ke {normalizedPhone}</p>
                  </div>

                  <Button type="submit" className="h-12 w-full rounded-lg bg-rose text-cream hover:bg-rose/90" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
                    Verifikasi & Masuk
                  </Button>
                  <button
                    type="button"
                    className="w-full font-body text-sm font-bold text-rose hover:text-soil"
                    onClick={() => {
                      setStep('phone')
                      setOtp('')
                      setError('')
                      setMessage('')
                    }}
                  >
                    Ubah nomor HP
                  </button>
                </form>
              )}

              {message && (
                <p className="mt-5 rounded-md bg-moss/10 px-4 py-3 font-body text-sm text-soil">{message}</p>
              )}
              {error && (
                <p className="mt-5 rounded-md bg-rose/10 px-4 py-3 font-body text-sm text-rose">{error}</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
