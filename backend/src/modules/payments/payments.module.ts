import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MercadopagoService } from './mercadopago.service';
import { PaymentExpiryProcessor, PAYMENT_EXPIRY_QUEUE } from './payment-expiry.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: PAYMENT_EXPIRY_QUEUE }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadopagoService, PaymentExpiryProcessor],
  exports: [PaymentsService],
})
export class PaymentsModule {}
