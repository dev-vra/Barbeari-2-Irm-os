import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Users, Search, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatCpf, formatDate } from '../../lib/utils'
import MaskedInput from '../../components/ui/MaskedInput'
import { maskCpf, maskPhone, maskDate, dateDisplayToIso, isoToDateDisplay, digitsOnly } from '../../lib/masks'

const createSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().refine(v => v.replace(/\D/g, '').length === 11, 'CPF inválido (11 dígitos)'),
  phone: z.string().optional(),
  birthdate: z.string().optional().refine(v => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v), 'Data inválida (dd/mm/aaaa)'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

const editSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().refine(v => v.replace(/\D/g, '').length === 11, 'CPF inválido (11 dígitos)'),
  phone: z.string().optional(),
  birthdate: z.string().optional().refine(v => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v), 'Data inválida (dd/mm/aaaa)'),
})

type CreateData = z.infer<typeof createSchema>
type EditData = z.infer<typeof editSchema>

export default function AdminClients() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-admin'],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { role: 'CLIENT' } })
      return data?.data || data
    },
  })

  const createForm = useForm<CreateData>({ resolver: zodResolver(createSchema) })
  const editForm = useForm<EditData>({ resolver: zodResolver(editSchema) })

  const filtered = clients.filter((c: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.cpf?.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    )
  })

  const openCreate = () => {
    setEditing(null)
    createForm.reset()
    setModalOpen(true)
  }

  const openEdit = (c: any) => {
    setEditing(c)
    editForm.reset({
      name: c.name,
      email: c.email,
      cpf: formatCpf(c.cpf),
      phone: c.phone || '',
      birthdate: c.birthdate ? isoToDateDisplay(c.birthdate.slice(0, 10)) : '',
    })
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        cpf: digitsOnly(data.cpf),
        birthdate: data.birthdate ? dateDisplayToIso(data.birthdate) : undefined,
      }
      return editing
        ? api.put(`/users/${editing.id}`, payload)
        : api.post('/users', { ...payload, role: 'CLIENT' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients-admin'] })
      setModalOpen(false)
      toast.success(editing ? 'Cliente atualizado!' : 'Cliente criado!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao salvar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients-admin'] })
      setDeleteTarget(null)
      toast.success('Cliente removido')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao remover'),
  })

  const handleSubmit = (data: CreateData | EditData) => {
    saveMutation.mutate(data)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Clientes</h1>
          <p className="text-[#888888] mt-1">{clients.length} cliente(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou CPF..."
          className="input pl-10 w-full"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        search ? (
          <div className="text-center py-12 text-[#555555]">
            Nenhum cliente encontrado para "{search}"
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Nenhum cliente cadastrado"
            action={<button onClick={openCreate} className="btn-primary">Cadastrar Cliente</button>}
          />
        )
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                {['Cliente', 'CPF', 'Contato', 'Nascimento', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} className="text-left pb-4 text-xs font-medium text-[#555555] uppercase tracking-wider pr-3 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filtered.map((client: any) => (
                <tr key={client.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#d4a853] font-bold text-sm">{client.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <p className="text-[#f5f5f5] font-medium text-sm">{client.name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 text-[#888888] text-sm font-mono">{formatCpf(client.cpf)}</td>
                  <td className="py-3.5 pr-3">
                    <p className="text-[#888888] text-sm">{client.email}</p>
                    {client.phone && <p className="text-[#555555] text-xs mt-0.5">{client.phone}</p>}
                  </td>
                  <td className="py-3.5 pr-3 text-[#888888] text-sm">
                    {client.birthdate ? formatDate(client.birthdate) : '—'}
                  </td>
                  <td className="py-3.5 pr-3 text-[#888888] text-sm">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(client)}
                        className="p-2.5 text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(client)}
                        className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
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

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        {editing ? (
          <form onSubmit={editForm.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Nome *</label>
                <input {...editForm.register('name')} className="input" />
                {editForm.formState.errors.name && (
                  <p className="text-red-400 text-xs mt-1">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="label">CPF *</label>
                <MaskedInput
                  mask={maskCpf}
                  registration={editForm.register('cpf')}
                  className="input"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
                {editForm.formState.errors.cpf && (
                  <p className="text-red-400 text-xs mt-1">{editForm.formState.errors.cpf.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input {...editForm.register('email')} type="email" className="input" />
              {editForm.formState.errors.email && (
                <p className="text-red-400 text-xs mt-1">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Telefone</label>
                <MaskedInput
                  mask={maskPhone}
                  registration={editForm.register('phone')}
                  className="input"
                  placeholder="(65) 9 9999-9999"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="label">Data de Nascimento</label>
                <MaskedInput
                  mask={maskDate}
                  registration={editForm.register('birthdate')}
                  className="input"
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                type="submit"
                disabled={editForm.formState.isSubmitting || saveMutation.isPending}
                className="btn-primary flex-1"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Nome *</label>
                <input {...createForm.register('name')} className="input" />
                {createForm.formState.errors.name && (
                  <p className="text-red-400 text-xs mt-1">{createForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="label">CPF *</label>
                <MaskedInput
                  mask={maskCpf}
                  registration={createForm.register('cpf')}
                  className="input"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
                {createForm.formState.errors.cpf && (
                  <p className="text-red-400 text-xs mt-1">{createForm.formState.errors.cpf.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input {...createForm.register('email')} type="email" className="input" />
              {createForm.formState.errors.email && (
                <p className="text-red-400 text-xs mt-1">{createForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Telefone</label>
                <MaskedInput
                  mask={maskPhone}
                  registration={createForm.register('phone')}
                  className="input"
                  placeholder="(65) 9 9999-9999"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="label">Data de Nascimento</label>
                <MaskedInput
                  mask={maskDate}
                  registration={createForm.register('birthdate')}
                  className="input"
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Senha *</label>
                <div className="relative">
                  <input
                    {...createForm.register('password')}
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#888888]"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {createForm.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1">{createForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="label">Confirmar Senha *</label>
                <div className="relative">
                  <input
                    {...createForm.register('confirmPassword')}
                    type={showConfirm ? 'text' : 'password'}
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#888888]"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {createForm.formState.errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">{createForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                type="submit"
                disabled={createForm.formState.isSubmitting || saveMutation.isPending}
                className="btn-primary flex-1"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Criar Cliente'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Remover Cliente"
        message={`Deseja remover "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
      />
    </div>
  )
}
