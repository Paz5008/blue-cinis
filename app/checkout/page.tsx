'use client';

import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutForm } from './CheckoutForm';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_sample');

export default function CheckoutPage() {
    const [clientSecret, setClientSecret] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch PaymentIntent clientSecret
        // This endpoint should be implemented in app/api/checkout/route.ts
        fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [{ id: 'artwork-demo', quantity: 1 }] })
        })
            .then(res => res.json())
            .then(data => {
                setClientSecret(data.clientSecret);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error fetching payment intent:', err);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-50">
                <Loader2 className="animate-spin text-stone-400" size={32} />
            </div>
        );
    }

    // Fallback if no server (for demo UI)
    const options = clientSecret ? { clientSecret } : { mode: 'payment' as const, amount: 5000, currency: 'eur' };

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-serif text-stone-900">Finaliser la commande</h1>
                    <p className="mt-2 text-sm text-stone-600">Sécurisé par Stripe</p>
                </div>

                {clientSecret ? (
                    <Elements stripe={stripePromise} options={options as any}>
                        <CheckoutForm />
                    </Elements>
                ) : (
                    <div className="text-center text-red-500">
                        Erreur de chargement du paiement. (API manquante ?)
                    </div>
                )}
            </div>
        </div>
    );
}
