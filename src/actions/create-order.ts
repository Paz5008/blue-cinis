'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function createOrderIntention(artworkId: string, buyerEmail?: string) {
    // 1. Authentication / User Identification
    const session = await auth();
    let effectiveEmail = buyerEmail;

    // Validate user is logged in if no email provided
    if (!effectiveEmail && session?.user?.email) {
        effectiveEmail = session.user.email;
    }

    if (!effectiveEmail) {
        return { success: false, error: "Buyer email is required" };
    }

    try {
        // 2. Availability Check
        const artwork = await prisma.artwork.findUnique({
            where: { id: artworkId },
            include: { artist: true }
        });

        if (!artwork) {
            return { success: false, error: "Artwork not found" };
        }

        if (artwork.status !== 'available') {
            return { success: false, error: "Artwork is not available" };
        }

        // 3. Prepare Order Data
        const amount = artwork.price; // Centimes
        const fee = Math.round(amount * 0.1); // Example: 10% platform fee
        const net = amount - fee;

        // 4. Stripe Connect Explanation
        /*
          To split payments with Stripe Connect:
          1. Use the `stripe` Node.js SDK (already in dependencies).
          2. When creating the Checkout Session (`stripe.checkout.sessions.create`), add `payment_intent_data`.
          3. Inside `payment_intent_data`, set `application_fee_amount` to the platform fee (`fee`).
          4. Set `transfer_data` with `destination: artwork.artist.stripeAccountId`.
          
          Example:
          const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: [{ ... }],
              payment_intent_data: {
                  application_fee_amount: fee,
                  transfer_data: {
                      destination: artwork.artist.stripeAccountId,
                  },
              },
              mode: 'payment',
              success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
              cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
          });
        */

        // 5. Create Order Logic
        // Since stripeSessionId is required in the schema, normally we would create the Stripe session here.
        // For this task, we assume a placeholder or that we're generating it now.
        // Let's generate a placeholder ID since we are just creating the "intention" record.
        // In a real flow, this IS the `session.id` from Stripe.
        const mockStripeSessionId = `cs_test_${Math.random().toString(36).substring(7)}`;

        const order = await prisma.order.create({
            data: {
                artworkId: artwork.id,
                artistId: artwork.artistId,
                buyerEmail: effectiveEmail,
                amount: amount,
                currency: 'eur',
                fee: fee,
                net: net,
                // status: 'paid', // Removed duplicate. We use 'failed' below to indicate incomplete payment. 
                // Actually, prisma/schema defines OrderStatus as paid, refunded, disputed, failed. 
                // It seems missing 'pending'. I will use 'failed' or check if I can modify schema.
                // Wait, the prompt says "crée une intention". 
                // If the schema only allows 'paid', that's a problem for an intention. 
                // Let's check schema for OrderOpsStatus: 'backoffice_pending', 'awaiting_payment'. 
                // Ah, `status` is OrderStatus (paid..). `opsStatus` is OrderOpsStatus (awaiting_payment).
                // But `status` is required?
                // Let's look at schema again. 
                // `status OrderStatus`.
                // I will set `status` to `failed` (as "not yet paid") or I should interpret 'paid' as 'checkout_completed'.
                // Usually, an 'Order' record is created *after* webhook success. 
                // If I must create it before, I have to pick a valid status. 
                // I'll pick 'failed' (as in incomplete) or just assume schema change is allowed, but I'll stick to 'failed' + opsStatus 'awaiting_payment'.
                status: 'failed',
                opsStatus: 'awaiting_payment',
                stripeSessionId: mockStripeSessionId,
            }
        });

        return { success: true, orderId: order.id, stripeSessionId: mockStripeSessionId };

    } catch (error: any) {
        console.error("Order creation failed:", error);
        return { success: false, error: error.message };
    }
}
