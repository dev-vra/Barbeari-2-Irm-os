import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SlotCalculatorService } from './slot-calculator.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { parseISO, parse, addMinutes } from 'date-fns';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private slotCalculator: SlotCalculatorService,
  ) {}

  async getSlots(professionalId: string, serviceId: string, date: string) {
    return this.slotCalculator.getAvailableSlots(professionalId, serviceId, date);
  }

  async create(clientId: string, dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service) throw new BadRequestException('Servico nao encontrado');

    const slots = await this.slotCalculator.getAvailableSlots(
      dto.professionalId,
      dto.serviceId,
      dto.date,
    );

    const slot = slots.find((s) => s.start === dto.slotStart);
    if (!slot || !slot.available) throw new BadRequestException('Horario nao disponivel');

    const [h, m] = dto.slotStart.split(':').map(Number);
    const scheduledAt = parseISO(dto.date);
    scheduledAt.setHours(h, m, 0, 0);
    const endsAt = addMinutes(scheduledAt, service.durationMin);

    const appointment = await this.prisma.appointment.create({
      data: {
        clientId,
        professionalId: dto.professionalId,
        serviceId: dto.serviceId,
        scheduledAt,
        endsAt,
        notes: dto.notes,
        status: 'CONFIRMED',
      },
      include: { service: true, professional: true },
    });

    return appointment;
  }

  async findAll(filters: {
    professionalId?: string;
    date?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { professionalId, date, status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (professionalId) where.professionalId = professionalId;
    if (status) where.status = status;
    if (date) {
      const d = parseISO(date);
      where.scheduledAt = { gte: new Date(d.setHours(0,0,0,0)), lte: new Date(d.setHours(23,59,59,999)) };
    }
    if (search) {
      where.client = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search.replace(/\D/g, '') } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, cpf: true, phone: true } },
          professional: { select: { id: true, name: true } },
          service: true,
          payment: true,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findMyAppointments(clientId: string) {
    return this.prisma.appointment.findMany({
      where: { clientId },
      orderBy: { scheduledAt: 'desc' },
      include: { service: true, professional: true, payment: true },
    });
  }

  async findOne(id: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, cpf: true } },
        professional: true,
        service: true,
        payment: true,
      },
    });
    if (!appt) throw new NotFoundException('Agendamento nao encontrado');
    return appt;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.appointment.update({ where: { id }, data: { status: status as any } });
  }
}
