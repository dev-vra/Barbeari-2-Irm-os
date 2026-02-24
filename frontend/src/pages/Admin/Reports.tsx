import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, Download, TrendingUp, Calendar, Package,
  Users, DollarSign, BarChart2, Loader2
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/utils'

interface ReportType {
  id: string
  label: string
  description: string
  icon: React.ElementType
  endpoint: string
  color: string
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'sales',
    label: 'Vendas',
    description: 'Faturamento, ticket médio e top serviços/produtos',
    icon: TrendingUp,
    endpoint: '/reports/sales',
    color: 'text-emerald-400',
  },
  {
    id: 'appointments',
    label: 'Agendamentos',
    description: 'Lista detalhada de atendimentos no período',
    icon: Calendar,
    endpoint: '/reports/appointments',
    color: 'text-blue-400',
  },
  {
    id: 'inventory',
    label: 'Inventário',
    description: 'Estoque atual, custos e valor total em estoque',
    icon: Package,
    endpoint: '/reports/inventory',
    color: 'text-amber-400',
  },
  {
    id: 'clients',
    label: 'Clientes',
    description: 'Base de clientes, frequência e histórico',
    icon: Users,
    endpoint: '/reports/clients',
    color: 'text-purple-400',
  },
  {
    id: 'commissions',
    label: 'Comissões',
    description: 'Comissões por profissional no período',
    icon: DollarSign,
    endpoint: '/reports/commissions',
    color: 'text-rose-400',
  },
  {
    id: 'cash-flow',
    label: 'Fluxo de Caixa',
    description: 'Entradas e saídas consolidadas',
    icon: BarChart2,
    endpoint: '/reports/cash-flow',
    color: 'text-cyan-400',
  },
]

export default function AdminReports() {
  const today = new Date()
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'))
  const [selectedReport, setSelectedReport] = useState<ReportType>(REPORT_TYPES[0])
  const [downloading, setDownloading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Preview data query (JSON)
  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['report-preview', selectedReport.id, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get(selectedReport.endpoint, {
        params: { startDate, endDate, format: 'json' },
      })
      return data
    },
    enabled: previewOpen,
    staleTime: 60_000,
  })

  const handleDownloadPdf = async () => {
    if (!startDate || !endDate) {
      toast.error('Selecione o período')
      return
    }
    setDownloading(true)
    try {
      const response = await api.get(selectedReport.endpoint, {
        params: { startDate, endDate, format: 'pdf' },
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedReport.id}-${startDate}-${endDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF gerado com sucesso!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao gerar PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handlePreview = () => {
    setPreviewOpen(true)
    refetchPreview()
  }

  // Quick stats from sales report
  const { data: dashStats } = useQuery({
    queryKey: ['report-sales-stats', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/reports/sales', {
        params: { startDate, endDate, format: 'json' },
      })
      return data
    },
    staleTime: 120_000,
  })

  const Icon = selectedReport.icon

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Relatórios</h1>
        <p className="text-[#888888] mt-1">Gere relatórios detalhados em PDF ou visualize os dados</p>
      </div>

      {/* Date Range */}
      <div className="card mb-8">
        <h2 className="text-[#f5f5f5] font-semibold mb-4">Período</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPreviewOpen(false) }}
              className="input"
            />
          </div>
          <div>
            <label className="label">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPreviewOpen(false) }}
              className="input"
            />
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Este mês', start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') },
              { label: 'Mês passado', start: format(startOfMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1)), 'yyyy-MM-dd'), end: format(endOfMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1)), 'yyyy-MM-dd') },
              { label: 'Este ano', start: `${today.getFullYear()}-01-01`, end: `${today.getFullYear()}-12-31` },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => { setStartDate(preset.start); setEndDate(preset.end); setPreviewOpen(false) }}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats (from Sales) */}
      {dashStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Faturamento', value: formatCurrency(dashStats.totalRevenue || 0), color: 'text-emerald-400' },
            { label: 'Atendimentos', value: dashStats.totalAppointments ?? '—', color: 'text-blue-400' },
            { label: 'Ticket Médio', value: formatCurrency(dashStats.averageTicket || 0), color: 'text-amber-400' },
            { label: 'Comissões', value: formatCurrency(dashStats.totalCommissions || 0), color: 'text-rose-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card">
              <p className="text-[#555555] text-xs uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Report Type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {REPORT_TYPES.map(rt => {
          const RtIcon = rt.icon
          const active = selectedReport.id === rt.id
          return (
            <button
              key={rt.id}
              onClick={() => { setSelectedReport(rt); setPreviewOpen(false) }}
              className={`card text-left transition-all ${active ? 'border-[#d4a853]/60 bg-[#d4a853]/5' : 'hover:border-[#2a2a2a]'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-[#1a1a1a] ${rt.color}`}>
                  <RtIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[#f5f5f5] font-semibold text-sm">{rt.label}</p>
                    {active && <span className="badge-gold text-xs">Selecionado</span>}
                  </div>
                  <p className="text-[#555555] text-xs mt-0.5">{rt.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-xl bg-[#1a1a1a] ${selectedReport.color}`}>
            <Icon size={22} />
          </div>
          <div>
            <h3 className="text-[#f5f5f5] font-semibold">Relatório de {selectedReport.label}</h3>
            <p className="text-[#555555] text-sm">{selectedReport.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="btn-primary flex items-center gap-2"
          >
            {downloading ? (
              <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</>
            ) : (
              <><Download size={16} /> Baixar PDF</>
            )}
          </button>

          <button
            onClick={handlePreview}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText size={16} /> Visualizar Dados
          </button>
        </div>

        {/* Preview section */}
        {previewOpen && (
          <div className="mt-6 border-t border-[#1f1f1f] pt-6">
            <h4 className="text-[#888888] text-sm font-medium mb-4 uppercase tracking-wider">
              Prévia — {selectedReport.label} ({startDate} a {endDate})
            </h4>
            {previewLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[#d4a853]" />
              </div>
            ) : previewData ? (
              <PreviewContent report={selectedReport} data={previewData} />
            ) : (
              <p className="text-[#555555] text-sm text-center py-8">Nenhum dado para o período selecionado</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Preview renderers ──────────────────────────────────────────────────────

function PreviewContent({ report, data }: { report: ReportType; data: any }) {
  if (!data) return null

  // Generic: render as a summary table with key-value pairs from top-level scalars
  const entries = Object.entries(data).filter(([, v]) => typeof v !== 'object' || v === null)

  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {entries.map(([key, value]) => (
            <div key={key} className="bg-[#0a0a0a] rounded-lg p-3">
              <p className="text-[#555555] text-xs capitalize mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-[#f5f5f5] font-semibold text-sm">
                {typeof value === 'number' && key.toLowerCase().includes('value')
                  ? formatCurrency(value as number)
                  : String(value ?? '—')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Render any array fields as mini tables */}
      {Object.entries(data)
        .filter(([, v]) => Array.isArray(v) && (v as any[]).length > 0)
        .slice(0, 2)
        .map(([key, arr]) => {
          const rows = arr as Record<string, any>[]
          const cols = Object.keys(rows[0] || {}).slice(0, 5)
          return (
            <div key={key}>
              <p className="text-[#888888] text-xs uppercase tracking-wider mb-2">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {cols.map(c => (
                        <th key={c} className="text-left text-xs text-[#555555] pb-2 pr-4 uppercase">
                          {c.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {rows.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {cols.map(c => (
                          <td key={c} className="text-[#888888] py-1.5 pr-4">
                            {row[c] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <p className="text-[#555555] text-xs mt-2">... e mais {rows.length - 10} registros. Baixe o PDF para ver tudo.</p>
                )}
              </div>
            </div>
          )
        })}
    </div>
  )
}
