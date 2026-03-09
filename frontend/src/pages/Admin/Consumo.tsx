import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Plus, Minus, Trash2, CheckCircle, ShoppingCart, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/utils'

interface CartItem {
  product: any
  quantity: number
}

const BEVERAGE_EMOJI: Record<string, string> = {
  cerveja: '🍺', beer: '🍺',
  café: '☕', cafe: '☕', expresso: '☕', espresso: '☕',
  refri: '🥤', refrigerante: '🥤', soda: '🥤', coca: '🥤', guaraná: '🥤',
  água: '💧', agua: '💧', water: '💧',
  suco: '🍹', juice: '🍹',
  chá: '🍵', cha: '🍵', tea: '🍵',
  energético: '⚡', energetico: '⚡',
  leite: '🥛',
}

function getBeverageEmoji(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(BEVERAGE_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '🥃'
}

export default function AdminConsumo() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [clientId, setClientId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: beverages = [], isLoading } = useQuery({
    queryKey: ['beverages'],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: { type: 'BEVERAGE', includeInactive: false } })
      const list = data?.data || data
      return list.filter((p: any) => p.isActive && p.type === 'BEVERAGE')
    },
    staleTime: 30_000,
  })

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals-active'],
    queryFn: async () => { const { data } = await api.get('/professionals'); return data },
    staleTime: 60_000,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const { data } = await api.get('/users/clients')
      return data?.data || data || []
    },
    staleTime: 60_000,
  })

  const sellMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        cart.map(item =>
          api.post(`/products/${item.product.id}/sale`, {
            quantity: item.quantity,
            ...(clientId ? { clientId } : {}),
            ...(professionalId ? { professionalId } : {}),
          })
        )
      )
    },
    onSuccess: () => {
      setSuccess(true)
      setCart([])
      setClientId('')
      setProfessionalId('')
      setTimeout(() => setSuccess(false), 3000)
      toast.success('Consumo registrado!')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erro ao registrar consumo')
    },
  })

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const changeQty = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }

  const total = cart.reduce((sum, i) => sum + Number(i.product.salePrice) * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200 }}
        >
          <CheckCircle size={80} className="text-green-400 mx-auto mb-6" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-[#f5f5f5] mb-2">Consumo Registrado!</h2>
          <p className="text-[#888888]">A venda foi salva com sucesso.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5] flex items-center gap-2">
            <Coffee size={24} className="text-[#d4a853]" />
            Consumo Rápido
          </h1>
          <p className="text-[#888888] mt-1">Venda rápida de bebidas e consumíveis</p>
        </div>
        {cartCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#d4a853]/10 border border-[#d4a853]/20 rounded-xl">
            <ShoppingCart size={16} className="text-[#d4a853]" />
            <span className="text-[#d4a853] font-semibold text-sm">{cartCount} item(s)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: product grid */}
        <div className="xl:col-span-2 space-y-4">
          {/* Optional selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Cliente (opcional)</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="input"
              >
                <option value="">Sem cliente</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Profissional (opcional)</label>
              <select
                value={professionalId}
                onChange={e => setProfessionalId(e.target.value)}
                className="input"
              >
                <option value="">Sem profissional</option>
                {professionals.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product cards */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-36 rounded-2xl" />
              ))}
            </div>
          ) : beverages.length === 0 ? (
            <div className="card text-center py-16">
              <Coffee size={48} className="text-[#333333] mx-auto mb-4" />
              <p className="text-[#555555]">Nenhuma bebida cadastrada.</p>
              <p className="text-[#444444] text-sm mt-1">Cadastre produtos do tipo "Bebida/Consumível".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {beverages.map((product: any) => {
                const inCart = cart.find(i => i.product.id === product.id)
                const emoji = getBeverageEmoji(product.name)
                const outOfStock = product.stock === 0
                return (
                  <motion.button
                    key={product.id}
                    whileHover={!outOfStock ? { scale: 1.03 } : {}}
                    whileTap={!outOfStock ? { scale: 0.97 } : {}}
                    onClick={() => !outOfStock && addToCart(product)}
                    disabled={outOfStock}
                    className={`relative card p-4 flex flex-col items-center gap-2 text-center transition-all duration-200 min-h-[130px] justify-center
                      ${outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#d4a853]/40 hover:bg-[#1a1a1a] cursor-pointer'}
                      ${inCart ? 'border-[#d4a853]/30 bg-[#d4a853]/5' : ''}
                    `}
                  >
                    {inCart && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#d4a853] rounded-full flex items-center justify-center">
                        <span className="text-[#0a0a0a] text-xs font-bold">{inCart.quantity}</span>
                      </div>
                    )}
                    <span className="text-4xl leading-none">{emoji}</span>
                    <div>
                      <p className="text-[#f5f5f5] text-sm font-medium leading-tight">{product.name}</p>
                      <p className="text-[#d4a853] font-bold text-base mt-1">{formatCurrency(product.salePrice)}</p>
                    </div>
                    {outOfStock && <p className="text-red-400 text-xs">Sem estoque</p>}
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: cart */}
        <div className="xl:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4 flex items-center gap-2">
              <ShoppingCart size={18} className="text-[#d4a853]" />
              Pedido atual
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-10">
                <Coffee size={36} className="text-[#333333] mx-auto mb-3" />
                <p className="text-[#555555] text-sm">Nenhum item adicionado.</p>
                <p className="text-[#444444] text-xs mt-1">Toque nos produtos ao lado.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <AnimatePresence>
                  {cart.map(item => (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 py-2 border-b border-[#1f1f1f] last:border-0"
                    >
                      <span className="text-2xl">{getBeverageEmoji(item.product.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#f5f5f5] text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-[#d4a853] text-xs">{formatCurrency(Number(item.product.salePrice) * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => changeQty(item.product.id, -1)}
                          className="p-1.5 rounded-lg text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="text-[#f5f5f5] text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => changeQty(item.product.id, 1)}
                          className="p-1.5 rounded-lg text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] transition-colors">
                          <Plus size={12} />
                        </button>
                        <button onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors ml-1">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="flex items-center justify-between py-3 border-t border-[#1f1f1f] mb-4">
                  <span className="text-[#888888] font-medium">Total</span>
                  <span className="text-[#d4a853] font-black text-xl">{formatCurrency(total)}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => sellMutation.mutate()}
                    disabled={sellMutation.isPending}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    {sellMutation.isPending ? (
                      <><RefreshCw size={16} className="animate-spin" /> Registrando...</>
                    ) : (
                      <><CheckCircle size={16} /> Registrar Consumo</>
                    )}
                  </button>
                  <button
                    onClick={() => setCart([])}
                    className="btn-secondary w-full py-2.5 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
