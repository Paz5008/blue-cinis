import { NextRequest } from 'next/server';
import { handlePaymentsWebhook } from '@/lib/payments/webhooks';

export async function POST(req: NextRequest) {
  return handlePaymentsWebhook(req);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
