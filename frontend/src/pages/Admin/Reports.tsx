import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, Download, TrendingUp, Calendar, Package,
  Users, DollarSign, BarChart2, Loader2
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
      const { data } = await api.get(selectedReport.endpoint, {
        params: { startDate, endDate },
      })

      const doc = new jsPDF()
      const pageW = doc.internal.pageSize.getWidth()

      // Header
      doc.setFillColor(10, 10, 10)
      doc.rect(0, 0, pageW, 40, 'F')
      doc.setTextColor(212, 168, 83)
      doc.setFontSize(18)
      doc.text('BARBEARIA PAI E FILHO', pageW / 2, 18, { align: 'center' })
      doc.setFontSize(11)
      doc.setTextColor(200, 200, 200)
      doc.text(`Relatório de ${selectedReport.label}`, pageW / 2, 28, { align: 'center' })
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text(`Período: ${startDate} a ${endDate}`, pageW / 2, 35, { align: 'center' })

      let y = 50

      // Summary stats (top-level scalar values)
      const scalars = Object.entries(data).filter(([, v]) => typeof v !== 'object' || v === null)
      if (scalars.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor(40, 40, 40)
        doc.text('Resumo', 14, y)
        y += 8
        doc.setFontSize(10)
        for (const [key, value] of scalars) {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()
          const val = typeof value === 'number'
            ? (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('total') || key.toLowerCase().includes('paid') || key.toLowerCase().includes('pending') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('value') || key.toLowerCase().includes('commission'))
              ? formatCurrency(value)
              : String(value)
            : String(value ?? '—')
          doc.setTextColor(100, 100, 100)
          doc.text(`${label}:`, 14, y)
          doc.setTextColor(30, 30, 30)
          doc.text(val, 80, y)
          y += 7
        }
        y += 5
      }

      // Table data (array fields)
      const arrays = Object.entries(data).filter(([, v]) => Array.isArray(v) && (v as any[]).length > 0)
      for (const [key, arr] of arrays) {
        const rows = arr as Record<string, any>[]
        if (rows.length === 0) continue

        // Flatten nested objects for display
        const flatRows = rows.map(row => {
          const flat: Record<string, any> = {}
          for (const [k, v] of Object.entries(row)) {
            if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
              if ('name' in v) flat[k] = (v as any).name
              else if ('price' in v) flat[k] = formatCurrency(Number((v as any).price))
              else continue
            } else if (k === 'createdAt' || k === 'soldAt' || k === 'scheduledAt' || k === 'paidAt' || k === 'updatedAt') {
              flat[k] = v ? format(new Date(v as string), 'dd/MM/yyyy HH:mm') : '—'
            } else if (typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))) {
              const num = Number(v)
              if (k.toLowerCase().includes('price') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('cost') || k.toLowerCase().includes('sale') || k === 'totalPrice') {
                flat[k] = formatCurrency(num)
              } else {
                flat[k] = String(v)
              }
            } else if (typeof v !== 'object') {
              flat[k] = String(v ?? '—')
            }
          }
          return flat
        })

        const cols = Object.keys(flatRows[0] || {}).filter(c => c !== 'id' && !c.endsWith('Id'))
        if (cols.length === 0) continue

        const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()
        doc.setFontSize(12)
        doc.setTextColor(40, 40, 40)
        doc.text(title, 14, y)
        y += 2

        autoTable(doc, {
          startY: y,
          head: [cols.map(c => c.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim())],
          body: flatRows.map(row => cols.map(c => row[c] ?? '—')),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [212, 168, 83], textColor: [10, 10, 10], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 14, right: 14 },
        })

        y = (doc as any).lastAutoTable.finalY + 10
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Barbearia Pai e Filho — Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} — Página ${i}/${pageCount}`,
          pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' }
        )
      }

      doc.save(`${selectedReport.id}-${startDate}-${endDate}.pdf`)
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

  // Quick stats from dashboard endpoint
  const { data: dashStats } = useQuery({
    queryKey: ['report-dashboard-stats', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard', {
        params: { startDate, endDate },
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
            { label: 'Faturamento', value: formatCurrency(dashStats.monthRevenue || 0), color: 'text-emerald-400' },
            { label: 'Atendimentos', value: dashStats.monthAppointments ?? '—', color: 'text-blue-400' },
            { label: 'Ticket Médio', value: formatCurrency(dashStats.monthAppointments ? (dashStats.monthRevenue / dashStats.monthAppointments) : 0), color: 'text-amber-400' },
            { label: 'Comissões', value: formatCurrency(dashStats.monthCommissions || 0), color: 'text-rose-400' },
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
