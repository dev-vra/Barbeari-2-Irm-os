import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private _stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private config: ConfigService) {}

  private get stripe(): Stripe {
    if (!this._stripe) {
      const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) throw new Error('STRIPE_SECRET_KEY não configurada no .env');
      this._stripe = new Stripe(secretKey, { apiVersion: '2026-01-28.clover' as any });
    }
    return this._stripe;
  }

  async createCheckoutSession(params: {
    externalRef: string;
    customerEmail: string;
    serviceName: string;
    amountBrl: number;
    successUrl: string;
    cancelUrl: string;
  }) {
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60; // 30 min

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: { name: params.serviceName },
            unit_amount: Math.round(params.amountBrl * 100), // cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { externalRef: params.externalRef },
      expires_at: expiresAt,
    } as any);

    return { sessionId: session.id, sessionUrl: session.url! };
  }

  constructWebhookEvent(payload: Buffer, signature: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
