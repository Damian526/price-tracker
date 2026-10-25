import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      // Default to 'localhost' and port 1025 for Mailpit
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: false,
      ignoreTLS: true, // Prevents TLS errors on local connections
      // Only include 'auth' if you actually set a user/pass in .env
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }
  async sendPriceDropAlert(params: {
    to: string;
    productTitle: string;
    url: string;
    currentPrice: number;
    targetPrice: number;
    currency: string;
  }): Promise<boolean> {
    const { to, productTitle, url, currentPrice, targetPrice, currency } =
      params;

    try {
      const info = await this.transporter.sendMail({
        from: '"Price Tracker Alert" <alerts@pricetracker.local>',
        to,
        subject: `📉 Price Drop! ${productTitle} is now ${currentPrice} ${currency}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.5;">
            <h2>Price Drop Alert! 🎉</h2>
            <p>The product you are tracking has dropped to or below your target price.</p>
            <ul>
              <li><strong>Product:</strong> ${productTitle}</li>
              <li><strong>New Price:</strong> <span style="color: #16a34a; font-weight: bold;">${currentPrice} ${currency}</span></li>
              <li><strong>Your Target Price:</strong> ${targetPrice} ${currency}</li>
            </ul>
            <p><a href="${url}" style="background: #2563eb; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; display: inline-block;">Buy Now on Store</a></p>
          </div>
        `,
      });

      this.logger.log(`Alert email sent: ${info.messageId}`);
      // Mailpit runs a local Web UI, so we just log the localhost link
      this.logger.log(`📧 View email in Mailpit: http://localhost:8025`);

      return true;
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send price drop alert email: ${errMessage}`);
      return false;
    }
  }
}
