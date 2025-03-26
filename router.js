
import { Router } from 'express';
import { verifySignature } from '../middleware/verify-signature.js';
import { handleWebhook } from '../controllers/webhook-controllers.js';

const router = Router();

// When an HTTP POST is made to /api/webhook, verify the signature then handle the webhook.
router.post('/', verifySignature, handleWebhook);

export default router;
