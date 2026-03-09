import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingCart, Plus, Minus, Trash2, Package, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import Spinner from '../../components/ui/Spinner'

interface CartItem {
  productId: string
  name: string
  salePrice: number
  quantity: number
  stock: number
}

export default function AdminSales() {
  const qc = useQueryClient()
  const [cart, setCart] = useState<CartItem[]>([])
  const [clientId, setClientId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [search, setSearch] = useState('')

  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: ['products-sales'],
    queryFn: async () => { const { data } = await api.get('/products'); return data?.data || data },
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-sales'],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { role: 'CLIENT' } })
      return data?.data || data
    },
  })

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals-sales'],
    queryFn: async () => { const { data } = await api.get('/professionals'); return data },
  })

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Estoque insuficiente')
          return prev
        }
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      if (product.stock < 1) { toast.error('Produto sem estoque'); return prev }
      return [...prev, {
        productId: product.id,
        name: product.name,
        salePrice: Number(product.salePrice),
        quantity: 1,
        stock: product.stock,
      }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i
      const newQty = i.quantity + delta
      if (newQty < 1) return i
      if (newQty > i.stock) { toast.error('Estoque insuficiente'); return i }
      return { ...i, quantity: newQty }
    }))
  }

  const removeItem = (productId: string) => setCart(prev => prev.filter(i => i.productId !== productId))

  const total = cart.reduce((sum, i) => sum + i.salePrice * i.quantity, 0)

  const saleMutation = useMutation({
    mutationFn: async () => {
      for (const item of cart) {
        await api.post(`/products/${item.productId}/sale`, {
          quantity: item.quantity,
          ...(clientId ? { clientId } : {}),
          ...(professionalId ? { professionalId } : {}),
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products-sales'] })
      qc.invalidateQueries({ queryKey: ['products-admin'] })
      setCart([])
      setClientId('')
      setProfessionalId('')
      toast.success('Venda registrada com sucesso!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao registrar venda'),
  })

  const handleSubmit = () => {
    if (cart.length === 0) { toast.error('Carrinho vazio'); return }
    saleMutation.mutate()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Venda de Produtos</h1>
        <p className="text-[#888888] mt-1">Registre vendas de produtos de consumação</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product list */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Package size={18} className="text-[#d4a853]" />
              <h2 className="text-[#f5f5f5] font-semibold">Produtos disponíveis</h2>
            </div>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input mb-4"
            />
            {prodLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-[#555555] py-8">Nenhum produto encontrado</p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filtered.map((product: any) => {
                  const inCart = cart.find(i => i.productId === product.id)
                  const outOfStock = product.stock < 1
                  return (
                    <div key={product.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors
                      ${outOfStock ? 'border-[#1f1f1f] opacity-40' : 'border-[#1f1f1f] hover:border-[#333333]'}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-[#f5f5f5] font-medium text-sm">{product.name}</p>
                        <p className="text-[#555555] text-xs mt-0.5">
                          Estoque: {product.stock} · {formatCurrency(product.salePrice)}
                        </p>
                      </div>
                      <button
                        disabled={outOfStock || (inCart?.quantity ?? 0) >= product.stock}
                        onClick={() => addToCart(product)}
                        className="ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                          bg-[#d4a853]/10 text-[#d4a853] hover:bg-[#d4a853]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus size={13} />
                        {inCart ? `+1 (${inCart.quantity} no carrinho)` : 'Adicionar'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart + checkout */}
        <div className="flex flex-col gap-4">
          <div className="card flex-1">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart size={18} className="text-[#d4a853]" />
              <h2 className="text-[#f5f5f5] font-semibold">Carrinho</h2>
              {cart.length > 0 && (
                <span className="ml-auto text-xs text-[#888888]">{cart.length} item(s)</span>
              )}
            </div>

            {cart.length === 0 ? (
              <p className="text-center text-[#555555] text-sm py-6">Nenhum produto adicionado</p>
            ) : (
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 p-2.5 bg-[#1a1a1a] rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f5f5f5] text-sm font-medium truncate">{item.name}</p>
                      <p className="text-[#d4a853] text-xs">{formatCurrency(item.salePrice * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.productId, -1)}
                        className="p-1 text-[#888888] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] rounded transition-colors">
                        <Minus size={13} />
                      </button>
                      <span className="text-[#f5f5f5] text-sm w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, 1)}
                        className="p-1 text-[#888888] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] rounded transition-colors">
                        <Plus size={13} />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.productId)}
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="border-t border-[#1f1f1f] pt-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#888888] text-sm">Total</span>
                  <span className="text-[#d4a853] font-bold text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            {/* Client */}
            <div className="mb-3">
              <label className="label text-xs">Cliente (opcional)</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="input text-sm py-2">
                <option value="">— Selecionar cliente —</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Professional */}
            <div className="mb-4">
              <label className="label text-xs">Profissional (opcional — para comissão)</label>
              <select value={professionalId} onChange={e => setProfessionalId(e.target.value)} className="input text-sm py-2">
                <option value="">— Selecionar profissional —</option>
                {professionals.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || saleMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saleMutation.isPending ? (
                <><Spinner size="sm" /> Registrando...</>
              ) : (
                <><CheckCircle size={16} /> Registrar Venda</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
