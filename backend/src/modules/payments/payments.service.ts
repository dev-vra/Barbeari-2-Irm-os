import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadopagoService } from './mercadopago.service';
import { PAYMENT_EXPIRY_QUEUE } from './payment-expiry.processor';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private mercadopagoService: MercadopagoService,
    private config: ConfigService,
    @InjectQueue(PAYMENT_EXPIRY_QUEUE) private paymentExpiryQueue: Queue,
  ) {}

  async createPreference(appointmentId: string, clientId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clientId },
      include: {
        service: true,
        client: true,
        professional: true,
      },
    });

    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    if (appointment.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('Este agendamento não está aguardando pagamento');
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: { appointmentId },
    });
    if (existingPayment && existingPayment.status === 'PENDING') {
      return existingPayment;
    }

    const externalRef = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
    const backendUrl = this.config.get('BACKEND_URL') || 'http://localhost:3000';

    const preferenceData = await this.mercadopagoService.createPreference({
      externalRef,
      clientEmail: appointment.client.email,
      serviceName: `${appointment.service.name} - ${appointment.professional.name}`,
      amount: Number(appointment.service.price),
      notificationUrl: `${backendUrl}/api/payments/webhook`,
      successUrl: `${frontendUrl}/client/booking/success?appointmentId=${appointmentId}`,
      failureUrl: `${frontendUrl}/client/booking/failure?appointmentId=${appointmentId}`,
      pendingUrl: `${frontendUrl}/client/booking/pending?appointmentId=${appointmentId}`,
    });

    const payment = await this.prisma.payment.upsert({
      where: { appointmentId },
      update: {
        externalRef,
        preferenceId: preferenceData.preferenceId,
        expiresAt,
        status: 'PENDING',
      },
      create: {
        appointmentId,
        amount: appointment.service.price,
        externalRef,
        preferenceId: preferenceData.preferenceId,
        expiresAt,
      },
    });

    await this.paymentExpiryQueue.add(
      'expire-payment',
      { paymentId: payment.id, appointmentId },
      {
        delay: 15 * 60 * 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        jobId: `expiry-${payment.id}`,
      },
    );

    return {
      ...payment,
      initPoint: preferenceData.initPoint,
      sandboxInitPoint: preferenceData.sandboxInitPoint,
    };
  }

  async processWebhook(mercadopagoPaymentId: string) {
    try {
      const mpPayment = await this.mercadopagoService.getPayment(mercadopagoPaymentId);

      const externalRef = mpPayment.external_reference;
      if (!externalRef) return;

      const payment = await this.prisma.payment.findUnique({
        where: { externalRef },
        include: { appointment: { include: { professional: true, service: true } } },
      });
      if (!payment) return;

      const mpStatus = mpPayment.status;

      if (mpStatus === 'approved') {
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'APPROVED',
              mercadopagoId: String(mercadopagoPaymentId),
              paidAt: new Date(),
            },
          });

          await tx.appointment.update({
            where: { id: payment.appointmentId },
            data: { status: 'CONFIRMED' },
          });

          const professional = payment.appointment.professional;
          const service = payment.appointment.service;
          const commissionPct = Number(professional.serviceCommissionPct);
          const commissionAmount = (Number(service.price) * commissionPct) / 100;

          if (commissionAmount > 0) {
            await tx.commission.create({
              data: {
                professionalId: professional.id,
                type: 'SERVICE',
                appointmentId: payment.appointmentId,
                amount: commissionAmount,
              },
            });
          }
        });
      } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REJECTED' },
        });
        await this.prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: { status: 'CANCELLED' },
        });
      }
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);
    }
  }

  async getPaymentStatus(appointmentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { appointmentId },
      include: { appointment: true },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }
}
