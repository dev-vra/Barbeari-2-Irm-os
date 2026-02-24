import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, '')
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 11) return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING_PAYMENT: 'Aguard. Pagamento',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    NO_SHOW: 'Não Compareceu',
  }
  return map[status] || status
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    PENDING_PAYMENT: 'badge-yellow',
    CONFIRMED: 'badge-green',
    COMPLETED: 'badge-green',
    CANCELLED: 'badge-red',
    NO_SHOW: 'badge-red',
  }
  return map[status] || 'badge-gray'
}
