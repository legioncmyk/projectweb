'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, type Game, type Nominal, type Transaction, type Slider } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Search, Gamepad2, ChevronLeft, ChevronRight, User, Hash,
  Shield, TrendingUp, Package, ShoppingBag, Users,
  Settings, Image as ImageIcon, CreditCard, BarChart3, LogOut, Copy,
  Check, Trash2, Edit3, Plus, Eye, EyeOff, Send, ArrowLeft,
  RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Loader2,
  Menu, X, Zap, Star, ChevronDown, Phone, Filter, Lock,
  Wallet, QrCode, Ban, MessageSquare, DollarSign
} from 'lucide-react'

// ─── Utility ───────────────────────────────────────────────
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function sanitize(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    'MOBA': '🎮', 'Battle Royale': '🔫', 'RPG': '⚔️', 'Strategy': '🏰',
    'MMORPG': '🌍', 'Action': '💥', 'Sports': '⚽', 'Card': '🃏', 'Other': '🎯'
  }
  return map[cat] || '🎮'
}

function getCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    'MOBA': 'from-blue-600 to-blue-800',
    'Battle Royale': 'from-red-600 to-orange-700',
    'RPG': 'from-purple-600 to-purple-800',
    'Strategy': 'from-amber-600 to-amber-800',
    'MMORPG': 'from-emerald-600 to-emerald-800',
    'Action': 'from-rose-600 to-rose-800',
    'Sports': 'from-green-600 to-green-800',
    'Card': 'from-cyan-600 to-cyan-800',
    'Other': 'from-gray-600 to-gray-800',
  }
  return map[cat] || 'from-blue-600 to-blue-800'
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'processing': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'success': 'bg-green-500/20 text-green-400 border-green-500/30',
    'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return map[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    'pending': 'Menunggu', 'processing': 'Diproses', 'success': 'Berhasil', 'rejected': 'Ditolak'
  }
  return map[status] || status
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending': return <Clock className="w-3 h-3" />
    case 'processing': return <Loader2 className="w-3 h-3 animate-spin" />
    case 'success': return <CheckCircle className="w-3 h-3" />
    case 'rejected': return <XCircle className="w-3 h-3" />
    default: return <AlertCircle className="w-3 h-3" />
  }
}

function isImageUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://') || (str.startsWith('/') && str.length > 3)
}

const SESSION_ID = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)

// ─── Social Proof Data ───────────────────────────────────
const FAKE_NAMES = [
  'Arya','Rizky','Dimas','Farel','Naufal','Bayu','Kenzo','Satria','Galang','Hafiz',
  'Keisha','Zahra','Nadia','Aisyah','Dinda','Putri','Salma','Luna','Cinta','Rara',
  'Joko','Budi','Andi','Eko','Firman','Gilang','Haris','Irfan','Kemal','Lukman',
  'Maya','Sari','Dewi','Rina','Ani','Wulan','Fitri','Indah','Lestari','Novia',
  'Reza','Tio','Vino','Yoga','Zaki','Adit','Bagus','Cahyo','Dafa','Edo','Fian'
]
const GAME_NOMINALS = [
  'Free Fire 100 Diamond','Free Fire Membership Bulanan','Free Fire Booyah Pass Premium',
  'PUBG Mobile 60 UC','PUBG Mobile 325 UC','PUBG Mobile Royale Pass Elite',
  'MLBB 222 Diamond','MLBB Starlight Member','MLBB 86 Diamond',
  'Genshin Impact 3280 Genesis Crystal','Genshin Impact Welkin Moon','Honkai Star Rail 6480 Shard',
  'Valorant 700 VP','Valorant Battlepass Premium','Call of Duty 400 CP',
  'Clash of Clans 1200 Gems','Clash Royale 1200 Gems','Brawl Stars 300 Gems',
  'Mobile Legends 444 Diamond','Free Fire 720 Diamond','PUBG Mobile 1800 UC',
  'Genshin Impact 980 Genesis Crystal','Free Fire 3640 Diamond','MLBB 1344 Diamond'
]

function generateFakePurchase() {
  const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)]
  const item = GAME_NOMINALS[Math.floor(Math.random() * GAME_NOMINALS.length)]
  const minsAgo = Math.floor(Math.random() * 30) + 1
  return { name, item, minsAgo, id: Math.random().toString(36).slice(2) }
}

// ─── Social Proof Notification Component ──────────────────
function SocialProofNotification() {
  const [notifications, setNotifications] = useState<Array<{id:string; name:string; item:string; minsAgo:number}>>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const addNotification = useCallback(() => {
    const purchase = generateFakePurchase()
    setNotifications(prev => [...prev.slice(-2), purchase]) // Keep max 3
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== purchase.id))
    }, 4000)
  }, [])

  useEffect(() => {
    const initial = setTimeout(() => {
      addNotification()
      const showNext = () => {
        const delay = Math.random() * 4000 + 4000 // 4-8s
        timerRef.current = setTimeout(() => {
          addNotification()
          showNext()
        }, delay)
      }
      showNext()
    }, 3000)
    return () => { clearTimeout(initial); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [addNotification])

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 320 }}>
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-white rounded-xl shadow-xl shadow-black/10 border border-slate-100 p-3 pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{n.name}</p>
                <p className="text-xs text-slate-500 truncate">baru saja membeli {n.item}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{n.minsAgo} menit yang lalu</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Top Buyers Today Component ───────────────────────────
function TopBuyersToday() {
  const [buyers] = useState<Array<{rank:number; name:string; game:string; amount:number; count:number}>>(() => {
    const topBuyers = FAKE_NAMES.slice(0, 10).map((name) => {
      const item = GAME_NOMINALS[Math.floor(Math.random() * GAME_NOMINALS.length)]
      const gameName = item.split(' ').slice(0, -2).join(' ') || item.split(' ')[0]
      const count = Math.floor(Math.random() * 8) + 1
      const basePrice = Math.floor(Math.random() * 500000) + 10000
      return { rank: 0, name, game: gameName, amount: basePrice * count, count }
    }).sort((a, b) => b.amount - a.amount).map((b, i) => ({ ...b, rank: i + 1 }))

    topBuyers[0] = { ...topBuyers[0], amount: Math.floor(Math.random() * 2000000) + 1500000, count: Math.floor(Math.random() * 5) + 5 }
    return topBuyers
  })

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/30'
      case 2: return 'bg-gradient-to-r from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-400/20'
      case 3: return 'bg-gradient-to-r from-orange-400 to-amber-600 text-white shadow-lg shadow-orange-500/20'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '👑'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">🏆 Top 10 Pembeli Terbanyak Hari Ini</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Leaderboard pembelian real-time</p>
        </div>
        <div className="divide-y divide-slate-100">
          {buyers.map(buyer => (
            <div key={buyer.rank} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${getRankStyle(buyer.rank)}`}>
                {buyer.rank <= 3 ? getRankIcon(buyer.rank) : `#${buyer.rank}`}
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {buyer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{buyer.name}</p>
                <p className="text-xs text-slate-500 truncate">{buyer.game} • {buyer.count}x transaksi</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-blue-600">{formatRupiah(buyer.amount)}</p>
                <p className="text-[10px] text-slate-400">total hari ini</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}

// ─── Ad Banner Component ───────────────────────────────────
function AdBanner() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const existing = document.querySelector('script[data-ad-invoke]')
    if (existing) return
    const script = document.createElement('script')
    script.src = 'https://pl29190180.profitablecpmratenetwork.com/f686f2e4d813d429defe29b06f6684bc/invoke.js'
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.setAttribute('data-ad-invoke', 'true')
    document.body.appendChild(script)
    return () => { script.remove() }
  }, [])

  return (
    <div className="w-full max-w-6xl mx-auto my-4 px-4">
      <div id="container-f686f2e4d813d429defe29b06f6684bc" />
    </div>
  )
}

// ─── Social Ad Bar Component ───────────────────────────────
function SocialAdBar() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const existing = document.querySelector('script[data-ad-social-bar]')
    if (existing) return
    const script = document.createElement('script')
    script.src = 'https://pl29190181.profitablecpmratenetwork.com/d7/31/79/d73179a9f70afbd2417bbc7e5334f9ac.js'
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.setAttribute('data-ad-social-bar', 'true')
    document.body.appendChild(script)
    return () => { script.remove() }
  }, [])

  return (
    <div className="w-full max-w-6xl mx-auto my-3 px-4">
      <div id="container-d73179a9f70afbd2417bbc7e5334f9ac" />
    </div>
  )
}

// ─── DANA Logo Component ───────────────────────────────────
function DanaLogo({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#108EE9] p-0.5" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size - 2} height={size - 2} fill="none">
        <rect width="24" height="24" rx="4" fill="#108EE9"/>
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">D</text>
      </svg>
    </div>
  )
}

// ─── Header Component ──────────────────────────────────────
function Header() {
  const { onlineCount, setCurrentView } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="ZallTopUp" width={36} height={36} className="rounded-lg shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-none tracking-tight">Zall<span className="text-blue-400">TopUp</span></span>
              <span className="text-[10px] text-blue-300/70 leading-none">Game Top Up Murah</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4" /> Games
            </button>
            <button onClick={() => setCurrentView('history')} className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" /> Cek Pesanan
            </button>
          </nav>

          <div className="hidden sm:flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">{onlineCount} online</span>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white p-2">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-slate-900/98 backdrop-blur-md border-t border-white/5 overflow-hidden">
            <div className="px-4 py-3 space-y-2">
              <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false) }} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white w-full py-2">
                <Gamepad2 className="w-4 h-4" /> Games
              </button>
              <button onClick={() => { setCurrentView('history'); setMobileMenuOpen(false) }} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white w-full py-2">
                <ShoppingBag className="w-4 h-4" /> Cek Pesanan
              </button>
              <div className="flex items-center gap-2 pt-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">{onlineCount} user online</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// ─── Hero Slider Component ─────────────────────────────────
function HeroSlider() {
  const { sliders, setCurrentView, setSelectedGame, games } = useStore()
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrent(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning])

  const next = useCallback(() => goTo((current + 1) % sliders.length), [current, sliders.length, goTo])
  const prev = useCallback(() => goTo((current - 1 + sliders.length) % sliders.length), [current, sliders.length, goTo])

  useEffect(() => {
    if (sliders.length <= 1) return
    timerRef.current = setInterval(next, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next, sliders.length])

  const handleSliderClick = (slider: Slider) => {
    if (slider.gameSlug) {
      const game = games.find(g => g.slug === slider.gameSlug)
      if (game) { setSelectedGame(game); setCurrentView('game'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    }
  }

  if (sliders.length === 0) return null

  const sliderGradients = ['from-blue-600 via-blue-700 to-indigo-800', 'from-emerald-600 via-emerald-700 to-teal-800', 'from-purple-600 via-purple-700 to-pink-800', 'from-orange-600 via-orange-700 to-red-800']
  const activeSlider = sliders[current]
  const hasBannerImage = activeSlider?.image && (activeSlider.image.startsWith('/') || activeSlider.image.startsWith('http'))

  return (
    <section className="relative w-full overflow-hidden rounded-2xl mt-4 mx-auto max-w-6xl">
      <div className="relative h-48 sm:h-64 md:h-80">
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }} className="absolute inset-0 cursor-pointer" onClick={() => handleSliderClick(sliders[current])}>
            {hasBannerImage ? (
              <>
                <Image src={activeSlider.image} alt={activeSlider.title} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              </>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${sliderGradients[current % sliderGradients.length]}`}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
              </div>
            )}
            <div className="relative h-full flex items-center px-6 sm:px-10 md:px-16">
              <div className="max-w-lg">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm mb-3 text-xs font-medium px-3 py-1"><Star className="w-3 h-3 mr-1" /> PROMO</Badge>
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 leading-tight drop-shadow-lg">{activeSlider?.title}</motion.h2>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-sm sm:text-base text-white/90 mb-4 drop-shadow-md">{activeSlider?.subtitle}</motion.p>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <span className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors">Top Up Sekarang <ChevronRight className="w-4 h-4" /></span>
                </motion.div>
              </div>
              {!hasBannerImage && <div className="absolute right-4 sm:right-10 md:right-16 top-1/2 -translate-y-1/2 opacity-10"><Gamepad2 className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 text-white" /></div>}
            </div>
          </motion.div>
        </AnimatePresence>
        {sliders.length > 1 && (<>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"><ChevronRight className="w-4 h-4" /></button>
        </>)}
        {sliders.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {sliders.map((_, i) => (<button key={i} onClick={() => goTo(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`} />))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Game Card Component ───────────────────────────────────
function GameCard({ game, index }: { game: Game; index: number }) {
  const { setSelectedGame, setCurrentView } = useStore()
  const [imgError, setImgError] = useState(false)
  const handleClick = () => { setSelectedGame(game); setCurrentView('game'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const minPrice = game.nominals.length > 0 ? Math.min(...game.nominals.map(n => n.price)) : 0
  const hasDiscount = game.nominals.some(n => n.originalPrice && n.originalPrice > n.price)
  const hasImage = game.image && isImageUrl(game.image) && !imgError

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}>
      <Card className="group cursor-pointer border-0 bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden" onClick={handleClick}>
        <CardContent className="p-0">
          <div className={`relative h-28 sm:h-32 bg-gradient-to-br ${getCategoryColor(game.category)} flex items-center justify-center overflow-hidden`}>
            {hasImage ? (
              <Image src={game.image} alt={game.name} fill className="object-cover" unoptimized onError={() => setImgError(true)} />
            ) : (
              <span className="text-4xl sm:text-5xl filter drop-shadow-lg">{getCategoryEmoji(game.category)}</span>
            )}
            {game.popular && <Badge className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 z-10"><Star className="w-2.5 h-2.5 mr-0.5" /> POPULER</Badge>}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
              <span className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold transform scale-90 group-hover:scale-100 transition-transform shadow-lg">Top Up</span>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">{game.name}</h3>
            <div className="flex items-center justify-between mt-2">
              <div>
                {hasDiscount ? <span className="text-green-600 text-sm font-bold">{formatRupiah(minPrice)}</span> : <span className="text-blue-600 text-sm font-bold">{formatRupiah(minPrice)}</span>}
                <p className="text-[11px] text-slate-400">Mulai dari</p>
              </div>
              <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">{game.category}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Game Grid (Home View) ────────────────────────────────
function GameGrid() {
  const { filteredGames, searchQuery, selectedCategory, games, setFilteredGames, setSearchQuery, setSelectedCategory } = useStore()
  const categories = ['Semua', ...Array.from(new Set(games.map(g => g.category)))]

  useEffect(() => {
    let result = games
    if (selectedCategory !== 'Semua') result = result.filter(g => g.category === selectedCategory)
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); result = result.filter(g => g.name.toLowerCase().includes(q)) }
    setFilteredGames(result)
  }, [games, selectedCategory, searchQuery, setFilteredGames])

  const popularGames = filteredGames.filter(g => g.popular)
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input type="text" placeholder="Cari game favorit kamu..." value={searchQuery} onChange={(e) => setSearchQuery(sanitize(e.target.value).slice(0, 100))} className="pl-12 pr-12 py-3 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-12" />
        {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setSelectedCategory(selectedCategory === 'Semua' ? 'Action' : 'Semua')} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors shrink-0 sm:hidden"><Filter className="w-4 h-4" /> Filter</button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            {cat !== 'Semua' && <span className="mr-1">{getCategoryEmoji(cat)}</span>}{cat}
          </button>
        ))}
      </div>

      {popularGames.length > 0 && searchQuery === '' && selectedCategory === 'Semua' && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-blue-600" /><h2 className="text-xl font-bold text-slate-900">Game Populer</h2><div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" /></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">{popularGames.map((game, i) => <GameCard key={game.id} game={game} index={i} />)}</div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4"><Gamepad2 className="w-5 h-5 text-blue-600" /><h2 className="text-xl font-bold text-slate-900">{searchQuery ? `Hasil Pencarian (${filteredGames.length})` : `Semua Game (${filteredGames.length})`}</h2><div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" /></div>
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">{filteredGames.map((game, i) => <GameCard key={game.id} game={game} index={i} />)}</div>
        ) : (
          <div className="text-center py-16"><Search className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-400">Game tidak ditemukan</p></div>
        )}
      </div>
    </section>
  )
}

// ─── Top Up Form (Game Detail View) ───────────────────────
function TopUpForm() {
  const {
    selectedGame, selectedNominal, setSelectedNominal,
    playerName, setPlayerName, playerId, setPlayerId,
    playerServer, setPlayerServer, playerWhatsapp, setPlayerWhatsapp,
    setCurrentView, resetForm, settings
  } = useStore()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [copiedDana, setCopiedDana] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [detailImgError, setDetailImgError] = useState(false)
  const [nominalCategory, setNominalCategory] = useState('all')
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [countdown, setCountdown] = useState(0)

  if (!selectedGame) return null

  const handleSubmit = async () => {
    if (!playerName.trim() || !playerId.trim()) { toast.error('Nama dan ID pemain wajib diisi!'); return }
    if (!selectedNominal) { toast.error('Pilih nominal terlebih dahulu!'); return }
    setConfirmDialog(true)
  }

  const confirmOrder = async () => {
    setConfirmDialog(false)
    setSubmitLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(), playerId: playerId.trim(),
          server: playerServer.trim(), gameId: selectedGame.id,
          gameName: selectedGame.name, nominalId: selectedNominal.id,
          nominalName: selectedNominal.name, price: selectedNominal.price,
          whatsapp: playerWhatsapp.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setOrderId(data.data.id)
        setOrderSuccess(true)
        setCountdown(900) // 15 min countdown
        toast.success('Pesanan berhasil dibuat! Admin akan memproses pesanan kamu.')
      } else {
        toast.error(data.message || 'Gagal membuat pesanan')
      }
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi nanti.')
    } finally { setSubmitLoading(false) }
  }

  const copyDana = () => {
    navigator.clipboard.writeText(settings.rekening || '085169300773')
    setCopiedDana(true)
    toast.success('Nomor DANA berhasil disalin!')
    setTimeout(() => setCopiedDana(false), 2000)
  }

  if (orderSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto py-12 px-4">
        {/* Success Header */}
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-2xl font-bold text-slate-900 mb-1">Pesanan Berhasil! 🎉</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-slate-500 text-sm">Admin akan segera memproses pesanan kamu</motion.p>
        </div>

        {/* Order ID */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-slate-900 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Order ID</p>
              <p className="text-sm font-mono text-white">{orderId.slice(0, 16).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Status</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <p className="text-sm text-yellow-400 font-medium">Menunggu Pembayaran</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Order Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-slate-200 mb-4">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Game</span>
                <span className="text-sm font-medium text-slate-900">{selectedGame.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Item</span>
                <span className="text-sm font-medium text-slate-900">{selectedNominal?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Pemain</span>
                <span className="text-sm font-medium text-slate-900">{playerName} ({playerId})</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Total Bayar</span>
                <span className="text-lg font-bold text-blue-600">{formatRupiah(selectedNominal?.price || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-blue-200 bg-gradient-to-b from-blue-50 to-white mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <DanaLogo size={28} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Transfer via DANA</p>
                  <p className="text-[10px] text-slate-500">Salin nomor di bawah lalu transfer</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100">
                <div>
                  <p className="font-mono text-lg font-bold text-slate-900">{settings.rekening || '085169300773'}</p>
                  <p className="text-[11px] text-slate-500">a.n. {settings.bankHolder || 'zallhostinger'}</p>
                </div>
                <button onClick={copyDana} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#108EE9] hover:bg-[#0d7fd4] text-white rounded-lg text-sm font-medium transition-colors">
                  {copiedDana ? <><Check className="w-4 h-4" /> Tersalin</> : <><Copy className="w-4 h-4" /> Salin</>}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-3">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Transfer dalam waktu 15 menit. Jika melebihi batas waktu, pesanan akan otomatis dibatalkan.</p>
          </div>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">Setelah transfer, cek status pesanan di menu &quot;Cek Pesanan&quot;. Hubungi admin via WhatsApp jika ada kendala.</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6">
          <Button onClick={() => { resetForm(); setOrderSuccess(false); setOrderId(''); setCurrentView('home') }} className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  const gameHasImage = selectedGame.image && isImageUrl(selectedGame.image) && !detailImgError

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      <button onClick={() => { resetForm(); setCurrentView('home') }} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /><span className="text-sm">Kembali ke daftar game</span>
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`rounded-xl bg-gradient-to-r ${getCategoryColor(selectedGame.category)} p-6 text-white relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent_50%)]" />
            <div className="relative flex items-center gap-4">
              {gameHasImage ? (
                <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shrink-0">
                  <Image src={selectedGame.image} alt={selectedGame.name} width={64} height={64} className="object-cover rounded-xl" unoptimized onError={() => setDetailImgError(true)} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shrink-0">{getCategoryEmoji(selectedGame.category)}</div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{selectedGame.name}</h1>
                <Badge className="bg-white/20 text-white border-white/30 mt-1">{selectedGame.category}</Badge>
              </div>
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> Form Top Up</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> Nama Pemain</label>
                <Input placeholder="Masukkan nama pemain" value={playerName} onChange={(e) => setPlayerName(sanitize(e.target.value).slice(0, 50))} className="h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Hash className="w-4 h-4 text-slate-400" /> ID Pemain</label>
                <Input placeholder="Masukkan ID pemain" value={playerId} onChange={(e) => setPlayerId(sanitize(e.target.value).slice(0, 50))} className="h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Shield className="w-4 h-4 text-slate-400" /> Server <span className="text-slate-400">(opsional)</span></label>
                <Input placeholder="Masukkan server (jika ada)" value={playerServer} onChange={(e) => setPlayerServer(sanitize(e.target.value).slice(0, 50))} className="h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> No. WhatsApp <span className="text-slate-400">(opsional)</span></label>
                <Input placeholder="08xxxxxxxxxx" value={playerWhatsapp} onChange={(e) => { setPlayerWhatsapp(e.target.value.replace(/[^0-9]/g, '').slice(0, 15)) }} className="h-11" />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-700">Pilih Nominal</h3>

                {/* Category Tabs */}
                {(() => {
                  const categories = Array.from(new Set(selectedGame.nominals.map(n => n.category).filter(Boolean)))
                  const filteredNominals = nominalCategory === 'all'
                    ? selectedGame.nominals
                    : selectedGame.nominals.filter(n => n.category === nominalCategory)

                  return (
                    <>
                      {categories.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          <button
                            onClick={() => { setNominalCategory('all'); setSelectedNominal(null) }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${nominalCategory === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                          >
                            Semua
                          </button>
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => { setNominalCategory(cat); setSelectedNominal(null) }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${nominalCategory === cat ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                        {filteredNominals.map(nom => (
                          <button key={nom.id} onClick={() => setSelectedNominal(nom)} className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 ${selectedNominal?.id === nom.id ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                            {/* Label Badge */}
                            {nom.label && (
                              <Badge className={`absolute -top-2.5 left-2 text-[9px] font-bold px-2 py-0.5 z-10 ${
                                nom.label === 'BEST SELLER' ? 'bg-orange-500 text-white' :
                                nom.label === 'HEMAT' ? 'bg-emerald-500 text-white' :
                                nom.label === 'POPULER' ? 'bg-blue-500 text-white' :
                                'bg-slate-500 text-white'
                              }`}>
                                {nom.label === 'BEST SELLER' ? '🔥 ' : nom.label === 'HEMAT' ? '💎 ' : nom.label === 'POPULER' ? '🎟️ ' : ''}{nom.label}
                              </Badge>
                            )}
                            {nom.originalPrice && nom.originalPrice > nom.price && (
                              <Badge className="absolute -top-2.5 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 z-10">
                                -{Math.round((1 - nom.price / nom.originalPrice) * 100)}%
                              </Badge>
                            )}
                            <p className={`text-sm font-semibold text-slate-800 ${nom.label ? 'mt-2' : ''}`}>{nom.name}</p>
                            <div className="mt-1">
                              <p className="text-sm font-bold text-blue-600">{formatRupiah(nom.price)}</p>
                              {nom.originalPrice && nom.originalPrice > nom.price && (
                                <p className="text-[11px] text-slate-400 line-through">{formatRupiah(nom.originalPrice)}</p>
                              )}
                            </div>
                            {selectedNominal?.id === nom.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {filteredNominals.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <p className="text-sm">Tidak ada item untuk kategori ini</p>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm sticky top-20">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Package className="w-5 h-5 text-blue-600" /> Ringkasan Pesanan</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Game</span><span className="text-slate-900 font-medium">{selectedGame.name}</span></div>
                {playerName && <div className="flex justify-between"><span className="text-slate-500">Nama</span><span className="text-slate-900">{playerName}</span></div>}
                {playerId && <div className="flex justify-between"><span className="text-slate-500">ID</span><span className="text-slate-900">{playerId}</span></div>}
                {playerServer && <div className="flex justify-between"><span className="text-slate-500">Server</span><span className="text-slate-900">{playerServer}</span></div>}
                {selectedNominal && (<>
                  <Separator />
                  <div className="flex justify-between"><span className="text-slate-500">Nominal</span><span className="text-slate-900">{selectedNominal.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Harga</span><span className="text-blue-600 font-bold text-base">{formatRupiah(selectedNominal.price)}</span></div>
                </>)}
              </div>

              <Separator />
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Metode Pembayaran</p>

                {/* DANA Payment */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <DanaLogo size={36} />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">DANA</p>
                      <p className="text-xs text-slate-500">Transfer via DANA</p>
                    </div>
                    <Badge className="bg-[#108EE9] text-white text-[10px]">Rekomendasi</Badge>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg p-2.5 mt-2">
                    <span className="font-mono text-sm text-slate-900 font-medium">{settings.rekening || '085169300773'}</span>
                    <button onClick={copyDana} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors" title="Salin nomor DANA">
                      {copiedDana ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">a.n. {settings.bankHolder || 'zallhostinger'}</p>
                </div>

                {/* QRIS Notice */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <Ban className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-700 text-sm">QRIS Sedang Bermasalah</p>
                      <p className="text-xs text-red-500 mt-0.5">Pembayaran via QRIS saat ini tidak tersedia. Silakan gunakan DANA atau hubungi admin via WhatsApp.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button onClick={handleSubmit} disabled={submitLoading || !selectedNominal} className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50">
                  {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Buat Pesanan</>}
                </Button>
                <a href={`https://wa.me/${settings.whatsapp || '6285169300773'}?text=${encodeURIComponent('Halo admin, saya ingin bertanya tentang top up.')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-green-500 text-green-600 hover:bg-green-50 transition-colors text-sm font-medium">
                  <Phone className="w-4 h-4" /> Chat Admin WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          {selectedNominal ? (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 truncate">{selectedNominal.name}</p>
              <p className="text-base font-bold text-blue-600">{formatRupiah(selectedNominal.price)}</p>
            </div>
          ) : (
            <div className="flex-1">
              <p className="text-sm text-slate-400">Pilih nominal terlebih dahulu</p>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitLoading || !selectedNominal}
            className="h-11 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 shrink-0"
          >
            {submitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-1.5" /> Pesan</>}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-blue-600" /> Konfirmasi Pesanan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Game</span><span className="font-medium">{selectedGame.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Item</span><span className="font-medium">{selectedNominal?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Pemain</span><span className="font-medium">{playerName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">ID</span><span className="font-medium">{playerId}</span></div>
              {playerServer && <div className="flex justify-between text-sm"><span className="text-slate-500">Server</span><span className="font-medium">{playerServer}</span></div>}
            </div>
            <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Total Pembayaran</span>
              <span className="text-lg font-bold text-blue-600">{formatRupiah(selectedNominal?.price || 0)}</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs text-amber-700 flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Pastikan data pemain sudah benar. Pesanan yang sudah dibuat tidak dapat dibatalkan secara otomatis.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialog(false)} className="flex-1">Batal</Button>
            <Button onClick={confirmOrder} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-1.5" /> Ya, Buat Pesanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Transaction History View ──────────────────────────────
function TransactionHistory() {
  const { setCurrentView } = useStore()
  const [searchName, setSearchName] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchName.trim()) { toast.error('Masukkan nama atau ID pemain'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?search=${encodeURIComponent(searchName.trim())}`)
      const data = await res.json()
      if (data.success) { setTransactions(data.data || []); if (!data.data?.length) toast.info('Tidak ada transaksi ditemukan') }
    } catch { toast.error('Gagal mengambil data') } finally { setLoading(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
      <button onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> <span className="text-sm">Kembali</span>
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2"><ShoppingBag className="w-6 h-6 text-blue-600" /> Cek Pesanan</h1>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input placeholder="Masukkan nama atau ID pemain..." value={searchName} onChange={(e) => setSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="h-11" />
            <Button onClick={handleSearch} disabled={loading} className="h-11 px-6 bg-blue-600 hover:bg-blue-700">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button>
          </div>
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <div className="space-y-3">
          {transactions.map(tx => (
            <Card key={tx.id} className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900">{tx.gameName}</span>
                  <Badge className={`text-[11px] border ${getStatusColor(tx.status)}`} variant="outline">
                    <span className="mr-1">{getStatusIcon(tx.status)}</span> {getStatusLabel(tx.status)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-500">
                  <div><span className="text-slate-400">Nama:</span> {tx.playerName}</div>
                  <div><span className="text-slate-400">ID:</span> {tx.playerId}</div>
                  <div><span className="text-slate-400">Nominal:</span> {tx.nominalName}</div>
                  <div><span className="text-slate-400">Harga:</span> <span className="text-blue-600 font-medium">{formatRupiah(tx.price)}</span></div>
                </div>
                {tx.notes && <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg p-2"><p className="text-xs text-yellow-700"><MessageSquare className="w-3 h-3 inline mr-1" />{tx.notes}</p></div>}
                <p className="text-[11px] text-slate-400 mt-2">{formatDate(tx.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Footer Component ──────────────────────────────────────
function Footer() {
  const { settings } = useStore()
  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="ZallTopUp" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-lg">Zall<span className="text-blue-400">TopUp</span></span>
            </div>
            <p className="text-sm text-slate-400">Top up game murah dan cepat. Pembayaran mudah via DANA. Proses cepat dan aman.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Metode Pembayaran</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <DanaLogo size={20} />
                <span>DANA: {settings.rekening || '085169300773'} (a.n. {settings.bankHolder || 'zallhostinger'})</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-400">
                <Ban className="w-4 h-4" />
                <span>QRIS: {settings.qrisStatus || 'Sedang bermasalah'}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Hubungi Kami</h3>
            <a href={`https://wa.me/${settings.whatsapp || '6285169300773'}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors">
              <Phone className="w-4 h-4" /> WhatsApp: {settings.whatsapp || '6285169300773'}
            </a>
          </div>
        </div>
        <Separator className="my-6 bg-slate-800" />
        <p className="text-center text-xs text-slate-500">&copy; {new Date().getFullYear()} ZallTopUp. All rights reserved.</p>
      </div>
    </footer>
  )
}

// ─── Admin Login ────────────────────────────────────────────
function AdminLogin() {
  const { setIsAdmin, setCurrentView } = useStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) { toast.error('Isi username dan password'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const data = await res.json()
      if (data.success) { toast.success('Login berhasil!'); setIsAdmin(true); setCurrentView('admin-dashboard') }
      else toast.error(data.message || 'Login gagal')
    } catch { toast.error('Terjadi kesalahan') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-green-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/25"><Lock className="w-7 h-7 text-white" /></div>
          <h1 className="text-xl font-bold text-white">Owner Login</h1>
          <p className="text-sm text-slate-400 mt-1">Masuk ke dashboard owner</p>
        </div>
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Username</label>
              <Input placeholder="Masukkan username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 pr-10" />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{loading ? 'Memproses...' : 'Masuk'}</Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ─── Owner Dashboard ────────────────────────────────────────
function OwnerDashboard() {
  const { games, setGames, sliders, setSliders, settings, setSettings, transactions, setTransactions, isAdmin, setIsAdmin, setCurrentView } = useStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'transactions' | 'sliders' | 'settings'>('overview')
  const [stats, setStats] = useState({ totalGames: 0, totalTransactions: 0, pendingTransactions: 0, completedTransactions: 0, totalRevenue: 0, onlineUsers: 0 })

  // Product dialog
  const [productDialog, setProductDialog] = useState(false)
  const [editProduct, setEditProduct] = useState<Game | null>(null)
  const [prodForm, setProdForm] = useState({ name: '', slug: '', image: '', category: 'Action', popular: false, nominals: '' })
  const [prodLoading, setProdLoading] = useState(false)

  // Transaction notes dialog
  const [notesDialog, setNotesDialog] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [txNotes, setTxNotes] = useState('')
  const [txLoading, setTxLoading] = useState(false)

  // Settings form
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({})
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Slider dialog
  const [sliderDialog, setSliderDialog] = useState(false)
  const [editSlider, setEditSlider] = useState<Slider | null>(null)
  const [sliderForm, setSliderForm] = useState({ title: '', subtitle: '', image: '', gameSlug: '', order: 0, active: true })
  const [sliderLoading, setSliderLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [gamesRes, slidersRes, settingsRes, txRes, statsRes] = await Promise.all([
        fetch('/api/products'), fetch('/api/slider'), fetch('/api/settings'),
        fetch('/api/admin/transactions?limit=50'), fetch('/api/admin/stats'),
      ])
      const [gamesData, slidersData, settingsData, txData, statsData] = await Promise.all([
        gamesRes.json(), slidersRes.json(), settingsRes.json(), txRes.json(), statsRes.json(),
      ])
      if (gamesData.success) setGames(gamesData.data || [])
      if (slidersData.success) setSliders(slidersData.data || [])
      if (settingsData.success) { setSettings(settingsData.data || {}); setSettingsForm(settingsData.data || {}) }
      if (txData.success) setTransactions(txData.data || [])
      if (statsData.success) setStats(statsData.data || { totalGames: 0, totalTransactions: 0, pendingTransactions: 0, completedTransactions: 0, totalRevenue: 0, onlineUsers: 0 })
    } catch { /* silent */ }
  }, [setGames, setSliders, setSettings, setTransactions])

  useEffect(() => { loadData() }, [loadData])

  // Auto refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleLogout = () => { setIsAdmin(false); setCurrentView('home'); window.location.hash = '' }

  // ─── Transaction Actions ──────────
  const handleUpdateTxStatus = async (txId: string, status: string) => {
    setTxLoading(true)
    try {
      const res = await fetch(`/api/transactions/${txId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) { toast.success(`Transaksi diubah ke ${getStatusLabel(status)}`); loadData() }
      else toast.error('Gagal mengubah status')
    } catch { toast.error('Terjadi kesalahan') } finally { setTxLoading(false) }
  }

  const handleUpdateTxNotes = async () => {
    if (!selectedTx) return
    setTxLoading(true)
    try {
      const res = await fetch(`/api/transactions/${selectedTx.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: txNotes }) })
      if (res.ok) { toast.success('Catatan berhasil disimpan'); setNotesDialog(false); setSelectedTx(null); loadData() }
      else toast.error('Gagal menyimpan catatan')
    } catch { toast.error('Terjadi kesalahan') } finally { setTxLoading(false) }
  }

  // ─── Product Actions ──────────
  const openProductDialog = (game?: Game) => {
    if (game) {
      setEditProduct(game)
      setProdForm({ name: game.name, slug: game.slug, image: game.image, category: game.category, popular: game.popular, nominals: game.nominals.map(n => `${n.name}:${n.price}:${n.originalPrice || ''}`).join('\n') })
    } else {
      setEditProduct(null)
      setProdForm({ name: '', slug: '', image: '', category: 'Action', popular: false, nominals: '' })
    }
    setProductDialog(true)
  }

  const handleSaveProduct = async () => {
    if (!prodForm.name || !prodForm.slug) { toast.error('Nama dan slug wajib diisi'); return }
    setProdLoading(true)
    try {
      const nominals = prodForm.nominals.trim().split('\n').filter(Boolean).map(line => {
        const parts = line.split(':')
        return { name: parts[0]?.trim() || '', price: Number(parts[1]) || 0, originalPrice: parts[2] ? Number(parts[2]) : undefined }
      }).filter(n => n.name && n.price > 0)

      if (editProduct) {
        const res = await fetch('/api/admin/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editProduct.id, name: prodForm.name, slug: prodForm.slug, image: prodForm.image, category: prodForm.category, popular: prodForm.popular }) })
        if (res.ok) { toast.success('Produk berhasil diperbarui'); setProductDialog(false); loadData() }
        else toast.error('Gagal memperbarui produk')
      } else {
        const res = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: prodForm.name, slug: prodForm.slug, image: prodForm.image, category: prodForm.category, popular: prodForm.popular, nominals }) })
        if (res.ok) { toast.success('Produk berhasil ditambahkan'); setProductDialog(false); loadData() }
        else toast.error('Gagal menambahkan produk')
      }
    } catch { toast.error('Terjadi kesalahan') } finally { setProdLoading(false) }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Hapus produk ini? Semua nominal juga akan terhapus.')) return
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Produk berhasil dihapus'); loadData() }
      else toast.error('Gagal menghapus produk')
    } catch { toast.error('Terjadi kesalahan') }
  }

  // ─── Slider Actions ──────────
  const openSliderDialog = (slider?: Slider) => {
    if (slider) {
      setEditSlider(slider)
      setSliderForm({ title: slider.title, subtitle: slider.subtitle, image: slider.image, gameSlug: slider.gameSlug || '', order: slider.order, active: slider.active })
    } else {
      setEditSlider(null)
      setSliderForm({ title: '', subtitle: '', image: '', gameSlug: '', order: 0, active: true })
    }
    setSliderDialog(true)
  }

  const handleSaveSlider = async () => {
    if (!sliderForm.title) { toast.error('Judul wajib diisi'); return }
    setSliderLoading(true)
    try {
      if (editSlider) {
        const res = await fetch('/api/admin/slider', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editSlider.id, ...sliderForm }) })
        if (res.ok) { toast.success('Slider berhasil diperbarui'); setSliderDialog(false); loadData() }
        else toast.error('Gagal memperbarui slider')
      } else {
        const res = await fetch('/api/admin/slider', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sliderForm) })
        if (res.ok) { toast.success('Slider berhasil ditambahkan'); setSliderDialog(false); loadData() }
        else toast.error('Gagal menambahkan slider')
      }
    } catch { toast.error('Terjadi kesalahan') } finally { setSliderLoading(false) }
  }

  const handleDeleteSlider = async (id: string) => {
    if (!confirm('Hapus slider ini?')) return
    try {
      const res = await fetch(`/api/admin/slider?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Slider berhasil dihapus'); loadData() }
      else toast.error('Gagal menghapus slider')
    } catch { toast.error('Terjadi kesalahan') }
  }

  // ─── Settings Actions ──────────
  const handleSaveSettings = async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsForm) })
      if (res.ok) { toast.success('Pengaturan berhasil disimpan'); loadData() }
      else toast.error('Gagal menyimpan pengaturan')
    } catch { toast.error('Terjadi kesalahan') } finally { setSettingsLoading(false) }
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { key: 'products' as const, label: 'Produk', icon: Package },
    { key: 'transactions' as const, label: 'Transaksi', icon: ShoppingBag },
    { key: 'sliders' as const, label: 'Banner', icon: ImageIcon },
    { key: 'settings' as const, label: 'Pengaturan', icon: Settings },
  ]

  const statCards = [
    { label: 'Total Game', value: stats.totalGames, icon: Gamepad2, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Transaksi', value: stats.totalTransactions, icon: ShoppingBag, color: 'from-purple-500 to-purple-600' },
    { label: 'Menunggu', value: stats.pendingTransactions, icon: Clock, color: 'from-yellow-500 to-amber-600' },
    { label: 'Berhasil', value: stats.completedTransactions, icon: CheckCircle, color: 'from-green-500 to-emerald-600' },
    { label: 'Pendapatan', value: formatRupiah(stats.totalRevenue), icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
    { label: 'User Online', value: stats.onlineUsers, icon: Users, color: 'from-cyan-500 to-blue-600' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-40 hidden lg:flex">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-400 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <div><span className="font-bold text-white text-sm">ZallTopUp</span><p className="text-[10px] text-slate-500">Owner Dashboard</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button onClick={() => { setCurrentView('home'); window.location.hash = '' }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><ArrowLeft className="w-4 h-4" />Ke Website</button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"><LogOut className="w-4 h-4" />Logout</button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-blue-400" /><span className="font-bold text-white text-sm">Owner Panel</span></div>
        <button onClick={handleLogout} className="text-red-400 text-sm flex items-center gap-1"><LogOut className="w-4 h-4" />Logout</button>
      </div>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${activeTab === tab.key ? 'text-blue-400' : 'text-slate-500'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-6 pt-16 lg:pt-6 pb-20 lg:pb-6 overflow-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-sm text-slate-400">Selamat datang, Owner</p>
              </div>
              <button onClick={loadData} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {statCards.map(card => (
                <Card key={card.label} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}><card.icon className="w-4 h-4 text-white" /></div>
                    </div>
                    <p className="text-lg font-bold text-white">{card.value}</p>
                    <p className="text-xs text-slate-500">{card.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Transactions */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Transaksi Terbaru</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {transactions.slice(0, 10).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{tx.playerName} - {tx.gameName}</p>
                        <p className="text-xs text-slate-500">{tx.nominalName} &middot; {formatRupiah(tx.price)}</p>
                      </div>
                      <Badge className={`text-[10px] border shrink-0 ml-2 ${getStatusColor(tx.status)}`} variant="outline">
                        <span className="mr-1">{getStatusIcon(tx.status)}</span>{getStatusLabel(tx.status)}
                      </Badge>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Belum ada transaksi</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Kelola Produk ({games.length})</h1>
              <Button onClick={() => openProductDialog()} className="bg-blue-600 hover:bg-blue-700 text-white text-sm"><Plus className="w-4 h-4 mr-1" />Tambah Produk</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {games.map(game => (
                <Card key={game.id} className="bg-slate-900 border-slate-800 overflow-hidden">
                  <div className="flex gap-3 p-3">
                    <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {game.image && isImageUrl(game.image) ? <Image src={game.image} alt={game.name} width={56} height={56} className="object-cover rounded-lg" unoptimized /> : <span className="text-2xl">{getCategoryEmoji(game.category)}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{game.name}</p>
                      <p className="text-xs text-slate-500">{game.category} &middot; {game.nominals.length} nominal</p>
                      <div className="flex items-center gap-2 mt-1">
                        {game.popular && <Badge className="bg-yellow-500/20 text-yellow-400 text-[9px] border border-yellow-500/30">POPULER</Badge>}
                        <span className="text-[10px] text-slate-600">{formatRupiah(Math.min(...game.nominals.map(n => n.price)))}+</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => openProductDialog(game)} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteProduct(game.id)} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Kelola Transaksi ({transactions.length})</h1>
              <button onClick={loadData} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {transactions.map(tx => (
                <Card key={tx.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white text-sm">{tx.playerName}</p>
                          <Badge className={`text-[10px] border ${getStatusColor(tx.status)}`} variant="outline"><span className="mr-1">{getStatusIcon(tx.status)}</span>{getStatusLabel(tx.status)}</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{tx.gameName} &middot; {tx.nominalName} &middot; <span className="text-blue-400 font-medium">{formatRupiah(tx.price)}</span></p>
                        <p className="text-xs text-slate-500 mt-1">ID: {tx.playerId}{tx.server ? ` | Server: ${tx.server}` : ''}{tx.whatsapp ? ` | WA: ${tx.whatsapp}` : ''}</p>
                        {tx.notes && <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2"><p className="text-xs text-yellow-400"><MessageSquare className="w-3 h-3 inline mr-1" />{tx.notes}</p></div>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-600">{formatDate(tx.createdAt)}</p>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setSelectedTx(tx); setTxNotes(tx.notes || ''); setNotesDialog(true) }} className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors"><MessageSquare className="w-3 h-3 mr-1" />Catatan</button>
                        {tx.status === 'pending' && (<>
                          <button onClick={() => handleUpdateTxStatus(tx.id, 'success')} disabled={txLoading} className="px-2.5 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs transition-colors"><CheckCircle className="w-3 h-3 mr-1" />Konfirmasi</button>
                          <button onClick={() => handleUpdateTxStatus(tx.id, 'rejected')} disabled={txLoading} className="px-2.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs transition-colors"><XCircle className="w-3 h-3 mr-1" />Tolak</button>
                        </>)}
                        {tx.status === 'processing' && (<>
                          <button onClick={() => handleUpdateTxStatus(tx.id, 'success')} disabled={txLoading} className="px-2.5 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs transition-colors"><CheckCircle className="w-3 h-3 mr-1" />Konfirmasi</button>
                          <button onClick={() => handleUpdateTxStatus(tx.id, 'rejected')} disabled={txLoading} className="px-2.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs transition-colors"><XCircle className="w-3 h-3 mr-1" />Tolak</button>
                        </>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {transactions.length === 0 && <div className="text-center py-12"><ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-3" /><p className="text-slate-500">Belum ada transaksi</p></div>}
            </div>
          </div>
        )}

        {/* Sliders Tab */}
        {activeTab === 'sliders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Kelola Banner ({sliders.length})</h1>
              <Button onClick={() => openSliderDialog()} className="bg-blue-600 hover:bg-blue-700 text-white text-sm"><Plus className="w-4 h-4 mr-1" />Tambah Banner</Button>
            </div>
            <div className="space-y-3">
              {sliders.map(slider => (
                <Card key={slider.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{slider.title}</p>
                        <p className="text-xs text-slate-500">{slider.subtitle || 'Tidak ada subtitle'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={slider.active ? 'bg-green-500/20 text-green-400 text-[9px] border border-green-500/30' : 'bg-slate-700 text-slate-400 text-[9px]'}>{slider.active ? 'AKTIF' : 'NONAKTIF'}</Badge>
                          <span className="text-[10px] text-slate-600">Order: {slider.order}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openSliderDialog(slider)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteSlider(slider.id)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <h1 className="text-xl font-bold text-white">Pengaturan Website</h1>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-white text-sm">Informasi Website</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Nama Website</label>
                    <Input value={settingsForm.siteName || ''} onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })} className="h-10 bg-slate-800 border-slate-700 text-white text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">WhatsApp Admin</label>
                    <Input value={settingsForm.whatsapp || ''} onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })} className="h-10 bg-slate-800 border-slate-700 text-white text-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-400" />Pembayaran DANA</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Nama Bank/E-Wallet</label>
                    <Input value={settingsForm.bankName || ''} onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })} className="h-10 bg-slate-800 border-slate-700 text-white text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Nomor DANA</label>
                    <Input value={settingsForm.rekening || ''} onChange={(e) => setSettingsForm({ ...settingsForm, rekening: e.target.value })} className="h-10 bg-slate-800 border-slate-700 text-white text-sm" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs text-slate-400">Atas Nama</label>
                    <Input value={settingsForm.bankHolder || ''} onChange={(e) => setSettingsForm({ ...settingsForm, bankHolder: e.target.value })} className="h-10 bg-slate-800 border-slate-700 text-white text-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2"><QrCode className="w-4 h-4 text-red-400" />Status QRIS</h3>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Keterangan QRIS</label>
                  <Input value={settingsForm.qrisStatus || ''} onChange={(e) => setSettingsForm({ ...settingsForm, qrisStatus: e.target.value })} className="h-10 bg-slate-800 border-slate-700 text-white text-sm" />
                  <p className="text-[10px] text-slate-600">Kosongkan jika QRIS aktif, isi pesan jika sedang bermasalah</p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveSettings} disabled={settingsLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{settingsLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        )}
      </main>

      {/* Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-xs text-slate-400">Nama Game *</label><Input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="space-y-2"><label className="text-xs text-slate-400">Slug *</label><Input value={prodForm.slug} onChange={(e) => setProdForm({ ...prodForm, slug: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="space-y-2"><label className="text-xs text-slate-400">URL Gambar (ikon game)</label><Input value={prodForm.image} onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })} placeholder="https://example.com/game-icon.png" className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Kategori</label>
              <div className="flex flex-wrap gap-1.5">
                {['MOBA', 'Battle Royale', 'RPG', 'Strategy', 'MMORPG', 'Action', 'Sports', 'Card', 'Other'].map(cat => (
                  <button key={cat} onClick={() => setProdForm({ ...prodForm, category: cat })} className={`px-3 py-1 rounded-full text-xs transition-colors ${prodForm.category === cat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{cat}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={prodForm.popular} onChange={(e) => setProdForm({ ...prodForm, popular: e.target.checked })} className="rounded" /><label className="text-xs text-slate-400">Tandai sebagai populer</label></div>
            {!editProduct && (
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Nominal (1 per baris: Nama:harga:harga_asli)</label>
                <Textarea value={prodForm.nominals} onChange={(e) => setProdForm({ ...prodForm, nominals: e.target.value })} rows={6} placeholder={"100 Diamonds:15000\n310 Diamonds:46000:46500\n520 Diamonds:77000:78000"} className="bg-slate-800 border-slate-700 text-white text-xs font-mono" />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProductDialog(false)} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Batal</Button>
            <Button onClick={handleSaveProduct} disabled={prodLoading} className="bg-blue-600 hover:bg-blue-700 text-white">{prodLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}{prodLoading ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slider Dialog */}
      <Dialog open={sliderDialog} onOpenChange={setSliderDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader><DialogTitle>{editSlider ? 'Edit Banner' : 'Tambah Banner Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-xs text-slate-400">Judul *</label><Input value={sliderForm.title} onChange={(e) => setSliderForm({ ...sliderForm, title: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="space-y-2"><label className="text-xs text-slate-400">Subtitle</label><Input value={sliderForm.subtitle} onChange={(e) => setSliderForm({ ...sliderForm, subtitle: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="space-y-2"><label className="text-xs text-slate-400">URL Gambar Banner</label><Input value={sliderForm.image} onChange={(e) => setSliderForm({ ...sliderForm, image: e.target.value })} placeholder="https://example.com/banner.jpg" className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="space-y-2"><label className="text-xs text-slate-400">Game Slug (link ke game)</label><Input value={sliderForm.gameSlug} onChange={(e) => setSliderForm({ ...sliderForm, gameSlug: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="flex items-center gap-4">
              <div className="space-y-2"><label className="text-xs text-slate-400">Urutan</label><Input type="number" value={sliderForm.order} onChange={(e) => setSliderForm({ ...sliderForm, order: Number(e.target.value) })} className="bg-slate-800 border-slate-700 text-white w-20" /></div>
              <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={sliderForm.active} onChange={(e) => setSliderForm({ ...sliderForm, active: e.target.checked })} className="rounded" /><label className="text-xs text-slate-400">Aktif</label></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSliderDialog(false)} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Batal</Button>
            <Button onClick={handleSaveSlider} disabled={sliderLoading} className="bg-blue-600 hover:bg-blue-700 text-white">{sliderLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}{sliderLoading ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialog} onOpenChange={setNotesDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader><DialogTitle>Catatan Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {selectedTx && (
              <div className="bg-slate-800 rounded-lg p-3 text-xs">
                <p className="text-slate-300"><span className="text-slate-500">Pemain:</span> {selectedTx.playerName} ({selectedTx.playerId})</p>
                <p className="text-slate-300"><span className="text-slate-500">Produk:</span> {selectedTx.gameName} - {selectedTx.nominalName}</p>
                <p className="text-slate-300"><span className="text-slate-500">Harga:</span> {formatRupiah(selectedTx.price)}</p>
              </div>
            )}
            <Textarea value={txNotes} onChange={(e) => setTxNotes(e.target.value)} rows={3} placeholder="Tambahkan catatan untuk transaksi ini..." className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNotesDialog(false)} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Batal</Button>
            <Button onClick={handleUpdateTxNotes} disabled={txLoading} className="bg-blue-600 hover:bg-blue-700 text-white">{txLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}{txLoading ? 'Menyimpan...' : 'Simpan Catatan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────
export default function HomePage() {
  const { currentView, setCurrentView, setGames, setSliders, setSettings, setOnlineCount } = useStore()
  const [initialLoading, setInitialLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [gamesRes, slidersRes, settingsRes] = await Promise.all([
          fetch('/api/products'), fetch('/api/slider'), fetch('/api/settings'),
        ])
        const [gamesData, slidersData, settingsData] = await Promise.all([gamesRes.json(), slidersRes.json(), settingsRes.json()])
        if (gamesData.success) setGames(gamesData.data || [])
        if (slidersData.success) setSliders(slidersData.data || [])
        if (settingsData.success) setSettings(settingsData.data || {})
      } catch { /* silent */ }
      setInitialLoading(false)
    }
    loadData()
  }, [setGames, setSliders, setSettings])

  // Online tracking
  useEffect(() => {
    const register = () => { fetch('/api/online', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: SESSION_ID }) }).catch(() => {}) }
    const getCount = () => { fetch('/api/online').then(r => r.json()).then(d => { if (d.success) setOnlineCount(d.count) }).catch(() => {}) }
    register()
    getCount()
    const heartbeat = setInterval(register, 30000)
    const countInterval = setInterval(getCount, 10000)
    return () => { clearInterval(heartbeat); clearInterval(countInterval) }
  }, [setOnlineCount])

  // Hash routing for admin
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'owner') setCurrentView('admin')
      else if (hash === 'owner-dashboard') setCurrentView('admin-dashboard')
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [setCurrentView])

  const isAdminView = currentView === 'admin' || currentView === 'admin-dashboard'

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-400 flex items-center justify-center mx-auto mb-4 animate-pulse"><Zap className="w-6 h-6 text-white" /></div>
          <p className="text-slate-400 text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col ${isAdminView ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {!isAdminView && <Header />}

      {/* Social Proof Notifications */}
      {!isAdminView && <SocialProofNotification />}

      <main className={`flex-1 ${isAdminView ? '' : 'pt-20'}`}>
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
                <HeroSlider />
                <AdBanner />
                <SocialAdBar />
              </div>
              <GameGrid />
              <TopBuyersToday />
            </motion.div>
          )}

          {currentView === 'game' && (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-24 lg:pb-12">
              <TopUpForm />
            </motion.div>
          )}

          {currentView === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="pt-24">
              <TransactionHistory />
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AdminLogin />
            </motion.div>
          )}

          {currentView === 'admin-dashboard' && (
            <motion.div key="admin-dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <OwnerDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isAdminView && <Footer />}
    </div>
  )
}
