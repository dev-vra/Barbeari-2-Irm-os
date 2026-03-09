import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency } from '../../lib/utils'

const PRODUCT_TYPES = [
  { value: 'HAIRCARE', label: 'Cuidado Capilar' },
  { value: 'BARBERING', label: 'Barbearia' },
  { value: 'SKINCARE', label: 'Skincare' },
  { value: 'ACCESSORY', label: 'Acessório' },
  { value: 'BEVERAGE', label: 'Bebida/Consumível' },
  { value: 'OTHER', label: 'Outro' },
]

const schema = z.object({
  name: z.string().min(2),
  type: z.string().min(1),
  description: z.string().optional(),
  stock: z.coerce.number().min(0),
  cost: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  commissionPct: z.coerce.number().min(0).max(100),
  supplier: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function AdminProducts() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-admin'],
    queryFn: async () => { const { data } = await api.get('/products', { params: { includeInactive: true } }); return data?.data || data },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { stock: 0, commissionPct: 15, type: 'HAIRCARE' },
  })

  const openCreate = () => { setEditing(null); reset({ stock: 0, commissionPct: 15, type: 'HAIRCARE', cost: 0, salePrice: 0 }); setModalOpen(true) }
  const openEdit = (p: any) => {
    setEditing(p)
    reset({ name: p.name, type: p.type, description: p.description || '', stock: p.stock, cost: Number(p.cost), salePrice: Number(p.salePrice), commissionPct: Number(p.commissionPct), supplier: p.supplier || '' })
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => editing ? api.put(`/products/${editing.id}`, data) : api.post('/products', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products-admin'] }); setModalOpen(false); toast.success(editing ? 'Produto atualizado!' : 'Produto criado!') },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao salvar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products-admin'] }); setDeleteTarget(null); toast.success('Produto desativado') },
  })

  const typeLabel = (type: string) => PRODUCT_TYPES.find(t => t.value === type)?.label || type

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Produtos</h1>
          <p className="text-[#888888] mt-1">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={18} /> Novo Produto</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum produto cadastrado"
          action={<button onClick={openCreate} className="btn-primary">Cadastrar Produto</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                {['Produto', 'Tipo', 'Estoque', 'Custo', 'Venda', 'Comissão', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left pb-4 text-xs font-medium text-[#555555] uppercase tracking-wider pr-3 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {products.map((prod: any) => (
                <tr key={prod.id} className={`hover:bg-[#1a1a1a]/50 transition-colors ${!prod.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-3.5 pr-3">
                    <p className="text-[#f5f5f5] font-medium text-sm">{prod.name}</p>
                    {prod.supplier && <p className="text-[#555555] text-xs mt-0.5">{prod.supplier}</p>}
                  </td>
                  <td className="py-3.5 pr-3"><span className="badge-gray text-xs">{typeLabel(prod.type)}</span></td>
                  <td className="py-3.5 pr-3">
                    <span className={`font-semibold text-sm ${prod.stock <= 5 ? 'text-red-400' : 'text-[#f5f5f5]'}`}>
                      {prod.stock} {prod.stock <= 5 && <AlertTriangle size={12} className="inline ml-1" />}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 text-[#888888] text-sm">{formatCurrency(prod.cost)}</td>
                  <td className="py-3.5 pr-3 text-[#d4a853] font-semibold text-sm">{formatCurrency(prod.salePrice)}</td>
                  <td className="py-3.5 pr-3 text-[#888888] text-sm">{Number(prod.commissionPct)}%</td>
                  <td className="py-3.5 pr-3">
                    <span className={prod.isActive ? 'badge-green' : 'badge-gray'}>{prod.isActive ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(prod)} className="p-2.5 text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] rounded-lg transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(prod)} className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Produto' : 'Novo Produto'} size="lg">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nome *</label>
              <input {...register('name')} className="input" />
              {errors.name && <p className="text-red-400 text-xs mt-1">Obrigatório</p>}
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select {...register('type')} className="input">
                {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea {...register('description')} className="input resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Estoque Atual</label>
              <input {...register('stock')} type="number" min={0} className="input" />
            </div>
            <div>
              <label className="label">Fornecedor</label>
              <input {...register('supplier')} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Custo (R$)</label>
              <input {...register('cost')} type="number" min={0} step={0.01} className="input" />
            </div>
            <div>
              <label className="label">Preço Venda (R$)</label>
              <input {...register('salePrice')} type="number" min={0} step={0.01} className="input" />
            </div>
            <div>
              <label className="label">Comissão (%)</label>
              <input {...register('commissionPct')} type="number" min={0} max={100} className="input" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">{isSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending} title="Desativar Produto"
        message={`Deseja desativar "${deleteTarget?.name}"?`} confirmLabel="Desativar" />
    </div>
  )
}
