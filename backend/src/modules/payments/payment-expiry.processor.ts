import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const PAYMENT_EXPIRY_QUEUE = 'payment-expiry';

export interface PaymentExpiryJob {
  paymentId: string;
  appointmentId: string;
}

@Processor(PAYMENT_EXPIRY_QUEUE)
export class PaymentExpiryProcessor {
  private readonly logger = new Logger(PaymentExpiryProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('expire-payment')
  async handleExpiry(job: Job<PaymentExpiryJob>) {
    const { paymentId, appointmentId } = job.data;
    this.logger.log(`Checking expiry for payment ${paymentId}`);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.status !== 'PENDING') {
      this.logger.log(`Payment ${paymentId} already processed, skipping`);
      return;
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
      }),
    ]);

    this.logger.log(`Payment ${paymentId} expired, appointment ${appointmentId} cancelled`);
  }
}
