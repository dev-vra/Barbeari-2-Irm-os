import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { PAYMENT_EXPIRY_QUEUE } from './payment-expiry.processor';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private config: ConfigService,
    @InjectQueue(PAYMENT_EXPIRY_QUEUE) private paymentExpiryQueue: Queue,
  ) {}

  async createCheckoutSession(appointmentId: string, clientId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clientId },
      include: { service: true, client: true, professional: true },
    });

    if (!appointment) throw new NotFoundException('Agendamento não encontrado');

    // Allow payment for CONFIRMED or PENDING_PAYMENT appointments
    if (!['CONFIRMED', 'PENDING_PAYMENT'].includes(appointment.status)) {
      throw new BadRequestException('Este agendamento não pode ser pago online');
    }

    // Return existing pending payment if it exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { appointmentId },
    });
    if (existingPayment?.status === 'PENDING' && existingPayment.preferenceId) {
      // preferenceId stores the Stripe session ID
      return { sessionUrl: existingPayment.preferenceId };
    }

    const externalRef = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';

    const { sessionId, sessionUrl } = await this.stripeService.createCheckoutSession({
      externalRef,
      customerEmail: appointment.client.email,
      serviceName: `${appointment.service.name} — ${appointment.professional.name}`,
      amountBrl: Number(appointment.service.price),
      successUrl: `${frontendUrl}/client/appointments?payment=success&appointmentId=${appointmentId}`,
      cancelUrl: `${frontendUrl}/client/appointments`,
    });

    const payment = await this.prisma.payment.upsert({
      where: { appointmentId },
      update: {
        externalRef,
        preferenceId: sessionUrl, // store sessionUrl for re-use
        expiresAt,
        status: 'PENDING',
      },
      create: {
        appointmentId,
        amount: appointment.service.price,
        externalRef,
        preferenceId: sessionUrl,
        expiresAt,
      },
    });

    await this.paymentExpiryQueue.add(
      'expire-payment',
      { paymentId: payment.id, appointmentId },
      {
        delay: 30 * 60 * 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        jobId: `expiry-${payment.id}`,
      },
    );

    return { sessionUrl };
  }

  async processWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') || '';

    let event: any;
    if (webhookSecret) {
      try {
        event = this.stripeService.constructWebhookEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        this.logger.warn(`Stripe webhook signature invalid: ${err.message}`);
        throw new BadRequestException('Invalid webhook signature');
      }
    } else {
      // Dev mode: skip signature verification
      event = JSON.parse(rawBody.toString());
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const externalRef = session.metadata?.externalRef;
      if (!externalRef) return;

      const payment = await this.prisma.payment.findUnique({
        where: { externalRef },
        include: { appointment: { include: { professional: true, service: true } } },
      });
      if (!payment) return;

      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'APPROVED',
            mercadopagoId: session.payment_intent || session.id, // reuse field
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

      this.logger.log(`Payment approved for appointment ${payment.appointmentId}`);
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const externalRef = session.metadata?.externalRef;
      if (!externalRef) return;

      const payment = await this.prisma.payment.findUnique({ where: { externalRef } });
      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REJECTED' },
        });
      }
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
