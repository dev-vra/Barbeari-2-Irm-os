import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { addMinutes, startOfDay, endOfDay, format, parseISO } from 'date-fns';

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

@Injectable()
export class SlotCalculatorService {
  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(
    professionalId: string,
    serviceId: string,
    date: string,
  ): Promise<TimeSlot[]> {
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return [];

    const targetDate = parseISO(date);
    const dayOfWeek = targetDate.getDay();

    const schedule = await this.prisma.schedule.findFirst({
      where: { professionalId, dayOfWeek, isActive: true },
    });
    if (!schedule) return [];

    const slots = this.buildSlotWindows(
      schedule.startTime,
      schedule.endTime,
      service.durationMin,
      targetDate,
    );

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        scheduledAt: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      },
      select: { scheduledAt: true, endsAt: true },
    });

    const now = new Date();

    return slots.map((slot) => {
      const slotStart = slot.startDateTime;
      const slotEnd = addMinutes(slotStart, service.durationMin);

      if (slotStart <= now) return { start: slot.start, end: slot.end, available: false };

      const blocked = existingAppointments.some(
        (appt) => slotStart < appt.endsAt && slotEnd > appt.scheduledAt,
      );

      return { start: slot.start, end: slot.end, available: !blocked };
    });
  }

  private buildSlotWindows(
    startTime: string,
    endTime: string,
    durationMin: number,
    date: Date,
  ) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const windowStart = new Date(date);
    windowStart.setHours(startH, startM, 0, 0);

    const windowEnd = new Date(date);
    windowEnd.setHours(endH, endM, 0, 0);

    const slots: Array<{ start: string; end: string; startDateTime: Date }> = [];
    let cursor = new Date(windowStart);
    const STEP_MIN = 15;

    while (addMinutes(cursor, durationMin) <= windowEnd) {
      const slotEnd = addMinutes(cursor, durationMin);
      slots.push({
        start: format(cursor, 'HH:mm'),
        end: format(slotEnd, 'HH:mm'),
        startDateTime: new Date(cursor),
      });
      cursor = addMinutes(cursor, STEP_MIN);
    }

    return slots;
  }
}
