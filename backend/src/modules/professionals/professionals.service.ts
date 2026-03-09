import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { AssignServiceDto } from './dto/assign-service.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProfessionalDto) {
    return this.prisma.professional.create({ data: dto as any });
  }

  async findAll(includeInactive = false) {
    return this.prisma.professional.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        professionalServices: { include: { service: true } },
        schedules: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
      include: {
        professionalServices: { include: { service: true } },
        schedules: true,
      },
    });
    if (!professional) throw new NotFoundException('Profissional n�o encontrado');
    return professional;
  }

  async update(id: string, dto: UpdateProfessionalDto) {
    const exists = await this.prisma.professional.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Profissional n�o encontrado');
    return this.prisma.professional.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.prisma.professional.update({ where: { id }, data: { isActive: false } });
    return { message: 'Profissional desativado' };
  }

  async assignService(id: string, dto: AssignServiceDto) {
    const commissionPct = dto.commissionPct ?? 0;
    return this.prisma.professionalService.upsert({
      where: { professionalId_serviceId: { professionalId: id, serviceId: dto.serviceId } },
      update: { commissionPct },
      create: { professionalId: id, serviceId: dto.serviceId, commissionPct },
    });
  }

  async removeService(professionalId: string, serviceId: string) {
    await this.prisma.professionalService.delete({
      where: { professionalId_serviceId: { professionalId, serviceId } },
    });
    return { message: 'Servi�o removido do profissional' };
  }

  async updateSchedule(professionalId: string, schedules: { dayOfWeek: number; startTime: string; endTime: string }[]) {
    await this.prisma.schedule.deleteMany({ where: { professionalId } });
    await this.prisma.schedule.createMany({
      data: schedules.map((s) => ({ ...s, professionalId })),
    });
    return this.findOne(professionalId);
  }
}
