import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class MercadopagoService {
  private readonly logger = new Logger(MercadopagoService.name);
  private client: MercadoPagoConfig;

  constructor(private config: ConfigService) {
    this.client = new MercadoPagoConfig({
      accessToken: this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN') || 'TEST-changeme',
    });
  }

  async createPreference(data: {
    externalRef: string;
    clientEmail: string;
    serviceName: string;
    amount: number;
    notificationUrl: string;
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
  }) {
    const preference = new Preference(this.client);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const response = await preference.create({
      body: {
        external_reference: data.externalRef,
        items: [
          {
            id: data.externalRef,
            title: data.serviceName,
            quantity: 1,
            unit_price: data.amount,
            currency_id: 'BRL',
          },
        ],
        payer: { email: data.clientEmail },
        notification_url: data.notificationUrl,
        back_urls: {
          success: data.successUrl,
          failure: data.failureUrl,
          pending: data.pendingUrl,
        },
        auto_return: 'approved',
        expires: true,
        expiration_date_to: expiresAt,
      },
    });

    return {
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
    };
  }

  async getPayment(mercadopagoId: string) {
    const payment = new Payment(this.client);
    return payment.get({ id: mercadopagoId });
  }

  verifyWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
    secret: string,
  ): boolean {
    try {
      const crypto = require('crypto');
      const parts = xSignature.split(';');
      const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
      const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1];
      if (!ts || !v1) return false;
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
      return hash === v1;
    } catch {
      return false;
    }
  }
}
