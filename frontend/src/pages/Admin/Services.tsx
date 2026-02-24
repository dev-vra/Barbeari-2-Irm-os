import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react'
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

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  durationMin: z.coerce.number().min(5, 'Mínimo 5 minutos'),
  price: z.coerce.number().min(0, 'Valor inválido'),
})
type FormData = z.infer<typeof schema>

export default function AdminServices() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-admin'],
    queryFn: async () => { const { data } = await api.get('/services', { params: { includeInactive: true } }); return data },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { durationMin: 30, price: 0 },
  })

  const openCreate = () => { setEditing(null); reset({ durationMin: 30, price: 0 }); setModalOpen(true) }
  const openEdit = (s: any) => {
    setEditing(s)
    reset({ name: s.name, description: s.description || '', durationMin: s.durationMin, price: Number(s.price) })
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => editing ? api.put(`/services/${editing.id}`, data) : api.post('/services', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services-admin'] }); setModalOpen(false); toast.success(editing ? 'Serviço atualizado!' : 'Serviço criado!') },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao salvar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services-admin'] }); setDeleteTarget(null); toast.success('Serviço desativado') },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Serviços</h1>
          <p className="text-[#888888] mt-1">{services.length} serviço(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : services.length === 0 ? (
        <EmptyState icon={Wrench} title="Nenhum serviço cadastrado"
          action={<button onClick={openCreate} className="btn-primary">Cadastrar Serviço</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                {['Serviço', 'Duração', 'Preço', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left pb-4 text-xs font-medium text-[#555555] uppercase tracking-wider pr-4 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {services.map((svc: any) => (
                <tr key={svc.id} className={`hover:bg-[#1a1a1a]/50 transition-colors ${!svc.isActive ? 'opacity-50' : ''}`}>
                  <td className="py-3.5 pr-4">
                    <p className="text-[#f5f5f5] font-medium">{svc.name}</p>
                    {svc.description && <p className="text-[#555555] text-xs mt-0.5">{svc.description}</p>}
                  </td>
                  <td className="py-3.5 pr-4 text-[#888888] text-sm">{svc.durationMin} min</td>
                  <td className="py-3.5 pr-4 text-[#d4a853] font-semibold">{formatCurrency(svc.price)}</td>
                  <td className="py-3.5 pr-4">
                    <span className={svc.isActive ? 'badge-green' : 'badge-gray'}>
                      {svc.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(svc)} className="p-1.5 text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(svc)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Serviço' : 'Novo Serviço'} size="sm">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input {...register('name')} className="input" placeholder="Ex: Corte de Cabelo" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea {...register('description')} className="input resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duração (min) *</label>
              <input {...register('durationMin')} type="number" min={5} step={5} className="input" />
              {errors.durationMin && <p className="text-red-400 text-xs mt-1">{errors.durationMin.message}</p>}
            </div>
            <div>
              <label className="label">Preço (R$) *</label>
              <input {...register('price')} type="number" min={0} step={0.01} className="input" />
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
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
        loading={deleteMutation.isPending} title="Desativar Serviço"
        message={`Deseja desativar "${deleteTarget?.name}"?`} confirmLabel="Desativar" />
    </div>
  )
}
