import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  photoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  serviceCommissionPct: z.coerce.number().min(0).max(100),
  productCommissionPct: z.coerce.number().min(0).max(100),
})
type FormData = z.infer<typeof schema>

export default function AdminProfessionals() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals-admin'],
    queryFn: async () => { const { data } = await api.get('/professionals', { params: { includeInactive: true } }); return data },
  })

  const { data: allServices = [] } = useQuery({
    queryKey: ['services-list'],
    queryFn: async () => { const { data } = await api.get('/services'); return data?.data || data },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { serviceCommissionPct: 30, productCommissionPct: 15 },
  })

  const openCreate = () => {
    setEditing(null)
    setSelectedServices([])
    reset({ serviceCommissionPct: 30, productCommissionPct: 15, photoUrl: '' })
    setModalOpen(true)
  }

  const openEdit = (p: any) => {
    setEditing(p)
    const svcIds = p.professionalServices?.map((ps: any) => ps.serviceId) || []
    setSelectedServices(svcIds)
    reset({
      name: p.name,
      description: p.description || '',
      photoUrl: p.photoUrl || '',
      serviceCommissionPct: Number(p.serviceCommissionPct),
      productCommissionPct: Number(p.productCommissionPct),
    })
    setModalOpen(true)
  }

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { ...data, photoUrl: data.photoUrl || undefined }
      let saved: any
      if (editing) {
        const { data: res } = await api.put(`/professionals/${editing.id}`, payload)
        saved = res
      } else {
        const { data: res } = await api.post('/professionals', payload)
        saved = res
      }

      const profId = saved.id || editing?.id
      const currentIds: string[] = (editing?.professionalServices ?? []).map((ps: any) => ps.serviceId)
      const toAdd = selectedServices.filter(id => !currentIds.includes(id))
      const toRemove = currentIds.filter((id: string) => !selectedServices.includes(id))

      await Promise.all([
        ...toAdd.map(sid => api.post(`/professionals/${profId}/services`, { serviceId: sid })),
        ...toRemove.map((sid: string) => api.delete(`/professionals/${profId}/services/${sid}`)),
      ])
      return saved
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professionals-admin'] })
      qc.invalidateQueries({ queryKey: ['professionals'] })
      setModalOpen(false)
      toast.success(editing ? 'Profissional atualizado!' : 'Profissional criado!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao salvar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/professionals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professionals-admin'] })
      setDeleteTarget(null)
      toast.success('Profissional desativado')
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Profissionais</h1>
          <p className="text-[#888888] mt-1">{professionals.length} profissional(is) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Profissional
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : professionals.length === 0 ? (
        <EmptyState icon={UserCheck} title="Nenhum profissional cadastrado"
          action={<button onClick={openCreate} className="btn-primary">Cadastrar Profissional</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {professionals.map((prof: any) => (
            <div key={prof.id} className={`card ${!prof.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {prof.photoUrl ? (
                    <img src={prof.photoUrl} alt={prof.name} className="w-14 h-14 object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#d4a853]">{prof.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#f5f5f5] font-semibold">{prof.name}</h3>
                  {prof.description && <p className="text-[#888888] text-xs mt-0.5 line-clamp-2">{prof.description}</p>}
                  {!prof.isActive && <span className="badge-gray text-xs mt-1">Inativo</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-[#1a1a1a] rounded-lg p-2.5 text-center">
                  <p className="text-[#d4a853] font-bold">{Number(prof.serviceCommissionPct)}%</p>
                  <p className="text-[#555555] text-xs">Comissão Serviço</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-2.5 text-center">
                  <p className="text-[#d4a853] font-bold">{Number(prof.productCommissionPct)}%</p>
                  <p className="text-[#555555] text-xs">Comissão Produto</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-4 min-h-[24px]">
                {(!prof.professionalServices || prof.professionalServices.length === 0) && (
                  <span className="text-[#555555] text-xs italic">Nenhum serviço vinculado</span>
                )}
                {prof.professionalServices?.slice(0, 4).map((ps: any) => (
                  <span key={ps.serviceId} className="badge-gold text-xs">{ps.service?.name}</span>
                ))}
                {prof.professionalServices?.length > 4 && (
                  <span className="badge-gray text-xs">+{prof.professionalServices.length - 4}</span>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-[#1f1f1f]">
                <button onClick={() => openEdit(prof)} className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1.5">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => setDeleteTarget(prof)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Profissional' : 'Novo Profissional'} size="lg">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nome *</label>
              <input {...register('name')} className="input" placeholder="Nome do profissional" />
              {errors.name && <p className="text-red-400 text-xs mt-1">Nome obrigatório (mín. 2 caracteres)</p>}
            </div>
            <div>
              <label className="label">URL da Foto</label>
              <input {...register('photoUrl')} className="input" placeholder="https://exemplo.com/foto.jpg" />
              {errors.photoUrl && <p className="text-red-400 text-xs mt-1">{errors.photoUrl.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea {...register('description')} className="input resize-none" rows={2} placeholder="Especialidades e experiência..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Comissão Serviços (%)</label>
              <input {...register('serviceCommissionPct')} type="number" min={0} max={100} className="input" />
            </div>
            <div>
              <label className="label">Comissão Produtos (%)</label>
              <input {...register('productCommissionPct')} type="number" min={0} max={100} className="input" />
            </div>
          </div>

          {/* Services multi-select */}
          <div>
            <label className="label mb-2">Serviços que realiza</label>
            {allServices.length === 0 ? (
              <p className="text-[#555555] text-xs italic">Nenhum serviço cadastrado ainda</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {allServices.map((svc: any) => {
                  const checked = selectedServices.includes(svc.id)
                  return (
                    <label key={svc.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none
                      ${checked
                        ? 'border-[#d4a853]/40 bg-[#d4a853]/10 text-[#d4a853]'
                        : 'border-[#1f1f1f] hover:border-[#333333] text-[#888888]'}`}>
                      <input
                        type="checkbox"
                        className="accent-[#d4a853] flex-shrink-0"
                        checked={checked}
                        onChange={() => toggleService(svc.id)}
                      />
                      <span className="text-sm truncate">{svc.name}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-1">
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Desativar Profissional"
        message={`Deseja desativar ${deleteTarget?.name}? Ele não aparecerá mais para novos agendamentos.`}
        confirmLabel="Desativar"
      />
    </div>
  )
}
