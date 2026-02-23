import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesData(startDate: Date, endDate: Date) {
    const sales = await this.prisma.productSale.findMany({
      where: { soldAt: { gte: startDate, lte: endDate } },
      include: {
        product: true,
        client: { select: { name: true, cpf: true } },
        professional: { select: { name: true } },
      },
      orderBy: { soldAt: 'desc' },
    });

    const total = sales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
    return { data: sales, total, count: sales.length };
  }

  async getAppointmentsData(startDate: Date, endDate: Date, professionalId?: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: startDate, lte: endDate },
        ...(professionalId ? { professionalId } : {}),
      },
      include: {
        client: { select: { name: true, cpf: true } },
        professional: { select: { name: true } },
        service: { select: { name: true, price: true } },
        payment: { select: { status: true, paidAt: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length;
    const revenue = appointments
      .filter((a) => a.payment?.status === 'APPROVED')
      .reduce((sum, a) => sum + Number(a.service.price), 0);

    return { data: appointments, total: appointments.length, confirmed, revenue };
  }

  async getInventoryData() {
    const products = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
    });

    const totalValue = products.reduce((sum, p) => sum + Number(p.salePrice) * p.stock, 0);
    const totalCost = products.reduce((sum, p) => sum + Number(p.cost) * p.stock, 0);
    const lowStock = products.filter((p) => p.stock <= 5).length;

    return { data: products, totalValue, totalCost, lowStock, count: products.length };
  }

  async getClientsData() {
    const clients = await this.prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        birthdate: true,
        createdAt: true,
        _count: { select: { appointments: true, productSales: true } },
      },
      orderBy: { name: 'asc' },
    });

    return { data: clients, count: clients.length };
  }

  async getCommissionsData(startDate: Date, endDate: Date, professionalId?: string) {
    const commissions = await this.prisma.commission.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(professionalId ? { professionalId } : {}),
      },
      include: {
        professional: { select: { name: true } },
        appointment: {
          select: { scheduledAt: true, service: { select: { name: true } } },
        },
        productSale: {
          select: { soldAt: true, product: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
    const paid = commissions.filter((c) => c.paidAt).reduce((sum, c) => sum + Number(c.amount), 0);
    const pending = total - paid;

    return { data: commissions, total, paid, pending, count: commissions.length };
  }

  async getCashFlowData(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        paidAt: { gte: startDate, lte: endDate },
      },
      include: {
        appointment: {
          include: {
            service: { select: { name: true, price: true } },
            client: { select: { name: true } },
            professional: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return { data: payments, totalRevenue, count: payments.length };
  }

  async getProfessionalsData() {
    const professionals = await this.prisma.professional.findMany({
      include: {
        professionalServices: { include: { service: true } },
        schedules: true,
        _count: { select: { appointments: true, productSales: true } },
      },
      orderBy: { name: 'asc' },
    });

    return { data: professionals, count: professionals.length };
  }

  async getAdminDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [
      appointmentsToday,
      appointmentsMonth,
      revenueMonth,
      pendingCommissions,
      totalClients,
      productsLowStock,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { scheduledAt: { gte: today, lte: todayEnd }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      this.prisma.appointment.count({
        where: { scheduledAt: { gte: monthStart, lte: monthEnd }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'APPROVED', paidAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.commission.aggregate({
        where: { paidAt: null },
        _sum: { amount: true },
      }),
      this.prisma.user.count({ where: { role: 'CLIENT', isActive: true } }),
      this.prisma.product.count({ where: { stock: { lte: 5 }, isActive: true } }),
    ]);

    return {
      appointmentsToday,
      appointmentsMonth,
      revenueMonth: Number(revenueMonth._sum.amount || 0),
      pendingCommissions: Number(pendingCommissions._sum.amount || 0),
      totalClients,
      productsLowStock,
    };
  }
}
