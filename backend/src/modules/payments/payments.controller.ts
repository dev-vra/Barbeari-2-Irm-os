import {
  Controller, Post, Get, Body, Param, Headers,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentPreferenceDto } from './dto/create-payment-preference.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout Session for an appointment' })
  createSession(
    @Body() dto: CreatePaymentPreferenceDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.createCheckoutSession(dto.appointmentId, user.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook (public)' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    await this.paymentsService.processWebhook(rawBody, signature || '');
    return { received: true };
  }

  @Get(':appointmentId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status for an appointment' })
  getStatus(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.getPaymentStatus(appointmentId);
  }
}
