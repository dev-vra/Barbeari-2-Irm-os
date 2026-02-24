import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Scissors, Clock, MapPin, Phone, Instagram, Star, Menu, X, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'

const NAV_LINKS = [
  { label: 'Início', href: '#hero' },
  { label: 'Serviços', href: '#services' },
  { label: 'Profissionais', href: '#team' },
  { label: 'Localização', href: '#location' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services-public'],
    queryFn: async () => { const { data } = await api.get('/services'); return data },
  })

  const { data: professionals = [], isLoading: loadingProfs } = useQuery({
    queryKey: ['professionals-public'],
    queryFn: async () => { const { data } = await api.get('/professionals'); return data },
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* -- NAVBAR -- */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1f1f1f]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#hero" className="flex items-center gap-2">
              <div className="p-1.5 bg-[#d4a853] rounded-lg">
                <Scissors size={18} className="text-[#0a0a0a]" />
              </div>
              <div className="leading-tight">
                <div className="text-[#d4a853] font-bold text-sm">BARBEARIA</div>
                <div className="text-[#f5f5f5] font-bold text-sm -mt-0.5">DO GUSTAVO</div>
              </div>
            </a>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href}
                  className="px-4 py-2 text-sm text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] rounded-lg transition-all">
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm text-[#888888] hover:text-[#f5f5f5] transition-colors px-4 py-2">
                Entrar
              </Link>
              <Link to="/login" className="btn-primary text-sm py-2 px-5">
                Agendar Agora
              </Link>
            </div>
            <button className="md:hidden p-2 text-[#888888]" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#111111] border-t border-[#1f1f1f] px-4 py-4 space-y-1">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] rounded-lg transition-all text-sm">
                {l.label}
              </a>
            ))}
            <div className="pt-2 border-t border-[#1f1f1f] flex flex-col gap-2 mt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm text-center">
                Entrar
              </Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center">
                Agendar Agora
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* -- HERO -- */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#d4a853]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4a853]/3 rounded-full blur-3xl" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#d4a853 1px, transparent 1px), linear-gradient(90deg, #d4a853 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full text-[#d4a853] text-sm font-medium mb-8">
            <Star size={14} fill="currentColor" />
            Cuiabá - MT &bull; Desde 2015
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-[#f5f5f5] mb-6 leading-none">
            BARBEARIA
            <span className="block text-[#d4a853]">DO GUSTAVO</span>
          </h1>
          <p className="text-xl text-[#888888] max-w-2xl mx-auto mb-10 leading-relaxed">
            Estilo, precisão e tradição. O melhor cuidado para cabelo e barba em Cuiabá.
            Profissionais especializados, ambiente premium.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-primary text-base px-8 py-3.5 flex items-center justify-center gap-2">
              Agendar Horário
              <ChevronRight size={18} />
            </Link>
            <a href="#services" className="btn-secondary text-base px-8 py-3.5">
              Ver Serviços
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 mt-14 pt-10 border-t border-[#1f1f1f]">
            {[
              { value: '8+', label: 'Anos de experiência' },
              { value: '5k+', label: 'Clientes atendidos' },
              { value: '3', label: 'Profissionais' },
              { value: '5★', label: 'Avaliação' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-black text-[#d4a853]">{stat.value}</div>
                <div className="text-xs text-[#555555] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#555555]">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-[#d4a853]/50" />
        </div>
      </section>

      {/* -- SERVICES -- */}
      <section id="services" className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full text-[#d4a853] text-sm font-medium mb-6">
              <Scissors size={14} />
              Nossos Serviços
            </div>
            <h2 className="section-title">O que oferecemos</h2>
            <div className="gold-line mx-auto" />
            <p className="section-subtitle mt-4">Serviços premium com qualidade e precisão</p>
          </div>
          {loadingServices ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc: any, i: number) => (
                <div key={svc.id}
                  className="group relative card hover:border-[#d4a853]/50 transition-all duration-300 cursor-default overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#d4a853] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-[#d4a853]/10 rounded-lg">
                      <Scissors size={20} className="text-[#d4a853]" />
                    </div>
                    <span className="text-[#d4a853] font-bold text-xl">{formatCurrency(svc.price)}</span>
                  </div>
                  <h3 className="text-[#f5f5f5] font-semibold text-lg mb-2">{svc.name}</h3>
                  {svc.description && <p className="text-[#888888] text-sm mb-4 leading-relaxed">{svc.description}</p>}
                  <div className="flex items-center gap-1.5 text-[#555555] text-xs">
                    <Clock size={12} />
                    <span>{svc.durationMin} minutos</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Link to="/login" className="btn-primary inline-flex items-center gap-2">
              Agendar Agora <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* -- TEAM -- */}
      <section id="team" className="py-24 px-4 sm:px-6 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full text-[#d4a853] text-sm font-medium mb-6">
              <Star size={14} />
              Nossa Equipe
            </div>
            <h2 className="section-title">Profissionais</h2>
            <div className="gold-line mx-auto" />
            <p className="section-subtitle mt-4">Especialistas dedicados ao seu estilo</p>
          </div>
          {loadingProfs ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {professionals.map((prof: any) => (
                <div key={prof.id} className="group card hover:border-[#d4a853]/50 transition-all duration-300 text-center">
                  <div className="relative mx-auto mb-5 w-24 h-24">
                    {prof.photoUrl ? (
                      <img src={`${import.meta.env.VITE_API_URL?.replace('/api','') || ''}/api/upload/files/${prof.photoUrl.split('/').pop()}`}
                        alt={prof.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-[#d4a853]/30 group-hover:border-[#d4a853] transition-colors" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#d4a853]/10 border-2 border-[#d4a853]/30 flex items-center justify-center group-hover:border-[#d4a853] transition-colors">
                        <span className="text-3xl font-bold text-[#d4a853]">{prof.name[0]}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-[#111111]" />
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* -- LOCATION -- */}
      <section id="location" className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-full text-[#d4a853] text-sm font-medium mb-6">
              <MapPin size={14} />
              Localização
            </div>
            <h2 className="section-title">Onde Estamos</h2>
            <div className="gold-line mx-auto" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                { icon: MapPin, label: 'Endereço', value: 'Av. Joaquim Louzada, 6
Novo Colorado, Cuiabá - MT
CEP 78042-515' },
                { icon: Clock, label: 'Horário de Funcionamento', value: 'Segunda a Sábado
08:00 às 20:00' },
                { icon: Phone, label: 'Telefone / WhatsApp', value: '(65) 98114-3182' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#d4a853]/10 rounded-xl flex items-center justify-center">
                    <Icon size={20} className="text-[#d4a853]" />
                  </div>
                  <div>
                    <p className="text-[#888888] text-sm mb-1">{label}</p>
                    <p className="text-[#f5f5f5] font-medium whitespace-pre-line">{value}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                  Agendar Agora <ChevronRight size={16} />
                </Link>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#1f1f1f] h-80 lg:h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3844.1!2d-56.0876!3d-15.5989!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x939db1b7a7c2f65b%3A0x1!2sAv.%20Joaquim%20Louzada%2C%206%20-%20Novo%20Colorado%2C%20Cuiab%C3%A1%20-%20MT!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" title="Barbearia do Gustavo - Localização"
              />
            </div>
          </div>
        </div>
      </section>

      {/* -- FOOTER -- */}
      <footer className="border-t border-[#1f1f1f] py-10 px-4 sm:px-6 bg-[#080808]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#d4a853] rounded-lg">
              <Scissors size={16} className="text-[#0a0a0a]" />
            </div>
            <div>
              <div className="text-[#d4a853] font-bold text-xs">BARBEARIA DO GUSTAVO</div>
              <div className="text-[#555555] text-xs">Cuiabá - MT</div>
            </div>
          </div>
          <p className="text-[#555555] text-sm">© {new Date().getFullYear()} Barbearia do Gustavo. Todos os direitos reservados.</p>
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
    </div>
  )
}
