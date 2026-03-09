import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Scissors, Clock, MapPin, Phone, Instagram, Star, Menu, X, ChevronRight, Calendar } from 'lucide-react'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/utils'

const NAV_LINKS = [
  { label: 'Início', href: '#hero' },
  { label: 'Serviços', href: '#services' },
  { label: 'Profissionais', href: '#team' },
  { label: 'Localização', href: '#location' },
]

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  size: 4 + (i % 3) * 3,
  top: `${10 + i * 14}%`,
  left: `${8 + i * 15}%`,
  delay: i * 1.1,
  duration: 6 + i * 1.5,
}))

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

function StatCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-2xl md:text-3xl font-black text-[#d4a853]"
      >
        {value}
      </motion.div>
      <div className="text-xs text-[#555555] mt-1">{label}</div>
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showFloatCTA, setShowFloatCTA] = useState(false)

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 50)
      setShowFloatCTA(window.scrollY > 400)
    }
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services-public'],
    queryFn: async () => { const { data } = await api.get('/services'); return data },
    staleTime: 60_000,
  })

  const { data: professionals = [], isLoading: loadingProfs } = useQuery({
    queryKey: ['professionals-public'],
    queryFn: async () => { const { data } = await api.get('/professionals'); return data },
    staleTime: 60_000,
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1f1f1f]' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#hero" className="flex items-center gap-2 group">
              <div className="p-1.5 bg-[#d4a853] rounded-lg group-hover:scale-105 transition-transform">
                <Scissors size={18} className="text-[#0a0a0a]" />
              </div>
              <div className="leading-tight">
                <div className="text-[#d4a853] font-bold text-sm tracking-widest">BARBEARIA</div>
                <div className="text-[#f5f5f5] font-bold text-sm -mt-0.5 tracking-widest">2 IRMÃOS</div>
              </div>
            </a>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href}
                  className="px-4 py-2 text-sm text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] rounded-lg transition-all duration-200">
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm text-[#888888] hover:text-[#f5f5f5] transition-colors px-4 py-2">
                Entrar
              </Link>
              <Link to="/login" className="btn-primary text-sm py-2 px-5 flex items-center gap-2">
                <Calendar size={14} /> Agendar Agora
              </Link>
            </div>
            <button className="md:hidden p-2 text-[#888888] hover:text-[#f5f5f5] transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="md:hidden overflow-hidden bg-[#111111] border-t border-[#1f1f1f]"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map(l => (
                  <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] rounded-lg transition-all text-sm">
                    {l.label}
                  </a>
                ))}
                <div className="pt-2 border-t border-[#1f1f1f] flex flex-col gap-2 mt-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm text-center">Entrar</Link>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center">Agendar Agora</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#d4a853]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4a853]/3 rounded-full blur-3xl" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#d4a853 1px, transparent 1px), linear-gradient(90deg, #d4a853 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          {/* Floating particles */}
          {PARTICLES.map(p => (
            <div key={p.id} className="absolute rounded-full bg-[#d4a853]/20 animate-float"
              style={{ width: p.size, height: p.size, top: p.top, left: p.left, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full text-[#d4a853] text-sm font-medium mb-8"
          >
            <Star size={14} fill="currentColor" />
            Cuiabá - MT &bull; Desde 2015
          </motion.div>

          <div className="overflow-hidden mb-2">
            <motion.h1
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-[#f5f5f5] leading-none"
            >
              BARBEARIA
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-6">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-[#d4a853] leading-none"
            >
              2 IRMÃOS
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl text-[#888888] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Estilo, precisão e tradição. O melhor cuidado para cabelo e barba em Cuiabá.
            Profissionais especializados, ambiente premium.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/login" className="btn-primary text-base px-8 py-3.5 flex items-center justify-center gap-2">
              Agendar Horário <ChevronRight size={18} />
            </Link>
            <a href="#services" className="btn-secondary text-base px-8 py-3.5">
              Ver Serviços
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center justify-center gap-8 mt-14 pt-10 border-t border-[#1f1f1f] flex-wrap gap-y-6"
          >
            {[
              { value: '8+', label: 'Anos de experiência' },
              { value: '5k+', label: 'Clientes atendidos' },
              { value: '3', label: 'Profissionais' },
              { value: '5★', label: 'Avaliação' },
            ].map(stat => (
              <StatCounter key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-12 bg-gradient-to-b from-transparent to-[#d4a853]/60 mx-auto"
          />
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full text-[#d4a853] text-sm font-medium mb-6">
              <Scissors size={14} /> Nossos Serviços
            </div>
            <h2 className="section-title">O que oferecemos</h2>
            <div className="gold-line mx-auto" />
            <p className="section-subtitle mt-4">Serviços premium com qualidade e precisão</p>
          </motion.div>

          {loadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card space-y-3">
                  <SkeletonCard className="h-10 w-10 rounded-lg" />
                  <SkeletonCard className="h-5 w-3/4" />
                  <SkeletonCard className="h-4 w-full" />
                  <SkeletonCard className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {services.map((svc: any) => (
                <motion.div key={svc.id} variants={fadeUp}
                  className="group relative glass-card p-6 hover:border-[#d4a853]/40 transition-all duration-300 cursor-default overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4a853] to-[#c49442] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-[#d4a853]/10 rounded-xl group-hover:bg-[#d4a853]/20 transition-colors">
                      <Scissors size={20} className="text-[#d4a853] group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <span className="text-[#d4a853] font-bold text-xl">{formatCurrency(svc.price)}</span>
                  </div>
                  <h3 className="text-[#f5f5f5] font-semibold text-lg mb-2">{svc.name}</h3>
                  {svc.description && <p className="text-[#888888] text-sm mb-4 leading-relaxed">{svc.description}</p>}
                  <div className="flex items-center gap-1.5 text-[#555555] text-xs">
                    <Clock size={12} />
                    <span>{svc.durationMin} minutos</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-12"
          >
            <Link to="/login" className="btn-primary inline-flex items-center gap-2">
              Agendar Agora <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team" className="py-24 px-4 sm:px-6 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full text-[#d4a853] text-sm font-medium mb-6">
              <Star size={14} /> Nossa Equipe
            </div>
            <h2 className="section-title">Profissionais</h2>
            <div className="gold-line mx-auto" />
            <p className="section-subtitle mt-4">Especialistas dedicados ao seu estilo</p>
          </motion.div>

          {loadingProfs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card flex flex-col items-center space-y-4 p-6">
                  <SkeletonCard className="w-24 h-24 rounded-full" />
                  <SkeletonCard className="h-5 w-32" />
                  <SkeletonCard className="h-4 w-full" />
                  <SkeletonCard className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {professionals.map((prof: any) => (
                <motion.div key={prof.id} variants={fadeUp}
                  className="group glass-card p-6 hover:border-[#d4a853]/40 transition-all duration-300 text-center"
                  whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(212,168,83,0.12)' }}
                >
                  <div className="relative mx-auto mb-5 w-24 h-24">
                    {prof.photoUrl ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/api/upload/files/${prof.photoUrl.split('/').pop()}`}
                        alt={prof.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-[#d4a853]/30 group-hover:border-[#d4a853] group-hover:scale-105 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#d4a853]/10 border-2 border-[#d4a853]/30 flex items-center justify-center group-hover:border-[#d4a853] group-hover:scale-105 transition-all duration-300">
                        <span className="text-3xl font-bold text-[#d4a853]">{prof.name[0]}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-[#080808]" />
                  </div>
                  <h3 className="text-[#f5f5f5] font-semibold text-lg mb-1">{prof.name}</h3>
                  {prof.description && (
                    <p className="text-[#888888] text-sm mb-4 leading-relaxed line-clamp-3">{prof.description}</p>
                  )}
                  {prof.professionalServices?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {prof.professionalServices.slice(0, 3).map((ps: any) => (
                        <span key={ps.serviceId} className="badge-gold text-xs">{ps.service?.name}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section id="location" className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full text-[#d4a853] text-sm font-medium mb-6">
              <MapPin size={14} /> Localização
            </div>
            <h2 className="section-title">Onde Estamos</h2>
            <div className="gold-line mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={stagger}
              className="space-y-6"
            >
              {[
                { icon: MapPin, label: 'Endereço', value: 'Av. Joaquim Louzada, 6\nNovo Colorado, Cuiabá - MT\nCEP 78042-515' },
                { icon: Clock, label: 'Horário de Funcionamento', value: 'Segunda a Sábado\n08:00 às 20:00' },
                { icon: Phone, label: 'Telefone / WhatsApp', value: '(65) 98114-3182' },
              ].map(({ icon: Icon, label, value }) => (
                <motion.div key={label} variants={fadeUp} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#d4a853]/10 rounded-xl flex items-center justify-center">
                    <Icon size={20} className="text-[#d4a853]" />
                  </div>
                  <div>
                    <p className="text-[#888888] text-sm mb-1">{label}</p>
                    <p className="text-[#f5f5f5] font-medium whitespace-pre-line">{value}</p>
                  </div>
                </motion.div>
              ))}
              <motion.div variants={fadeUp} className="pt-4">
                <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                  Agendar Agora <ChevronRight size={16} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl overflow-hidden border border-[#1f1f1f] h-80 lg:h-96"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3844.1!2d-56.0876!3d-15.5989!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x939db1b7a7c2f65b%3A0x1!2sAv.%20Joaquim%20Louzada%2C%206%20-%20Novo%20Colorado%2C%20Cuiab%C3%A1%20-%20MT!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" title="Barbearia 2 Irmãos - Localização"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1f1f1f] py-10 px-4 sm:px-6 bg-[#080808]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4a853] rounded-lg">
              <Scissors size={16} className="text-[#0a0a0a]" />
            </div>
            <div>
              <div className="text-[#d4a853] font-bold text-xs tracking-widest">BARBEARIA 2 IRMÃOS</div>
              <div className="text-[#555555] text-xs">Cuiabá - MT</div>
            </div>
          </div>
          <p className="text-[#555555] text-sm">© {new Date().getFullYear()} Barbearia 2 Irmãos. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              className="p-2 text-[#555555] hover:text-[#d4a853] hover:bg-[#d4a853]/10 rounded-lg transition-all">
              <Instagram size={18} />
            </a>
            <a href="https://wa.me/5565981143182" target="_blank" rel="noopener noreferrer"
              className="p-2 text-[#555555] hover:text-[#d4a853] hover:bg-[#d4a853]/10 rounded-lg transition-all">
              <Phone size={18} />
            </a>
          </div>
        </div>
      </footer>

      {/* ── MOBILE FLOATING CTA ── */}
      <AnimatePresence>
        {showFloatCTA && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="md:hidden fixed bottom-6 left-4 right-4 z-40"
          >
            <Link to="/login"
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base shadow-2xl shadow-[#d4a853]/20">
              <Calendar size={18} /> Agendar Horário Agora
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
