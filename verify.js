import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';

export function verifySignature(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    res.status(401).send('Missing signature');
    return;
  }

  // Use the raw body (captured in app.ts) to compute the HMAC digest.
  const hmac = crypto.createHmac('sha256', config.webhookSecret);
  hmac.update((req as any).rawBody);
  const digest = `sha256=${hmac.digest('hex')}`;

  if (signature !== digest) {
    res.status(401).send('Invalid signature');
    return;
  }

  next();
}
