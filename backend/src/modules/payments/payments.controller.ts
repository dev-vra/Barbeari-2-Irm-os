import {
  Controller, Post, Get, Body, Param, Headers,
  UseGuards, Res, HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { MercadopagoService } from './mercadopago.service';
import { CreatePaymentPreferenceDto } from './dto/create-payment-preference.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private mercadopagoService: MercadopagoService,
    private config: ConfigService,
  ) {}

  @Post('create-preference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create MP payment preference for an appointment' })
  createPreference(
    @Body() dto: CreatePaymentPreferenceDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.createPreference(dto.appointmentId, user.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mercado Pago webhook (public)' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Res() res: Response,
  ) {
    res.status(200).send();

    if (body?.type !== 'payment' || !body?.data?.id) return;

    const secret = this.config.get<string>('MERCADOPAGO_WEBHOOK_SECRET') || '';
    if (secret) {
      const valid = this.mercadopagoService.verifyWebhookSignature(
        xSignature || '',
        xRequestId || '',
        String(body.data.id),
        secret,
      );
      if (!valid) return;
    }

    await this.paymentsService.processWebhook(String(body.data.id));
  }

  @Get(':appointmentId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status for an appointment' })
  getStatus(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.getPaymentStatus(appointmentId);
  }
}
