'use client';

import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/success`,
            },
        });

        if (error) {
            toast.error(error.message || "Paiement échoué");
        } else {
            // Success logic
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* 1. Payment Element with Wallets Priority */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                <h3 className="text-lg font-medium mb-4">Paiement</h3>
                <PaymentElement
                    options={{
                        layout: {
                            type: 'tabs',
                            defaultCollapsed: false
                        },
                        wallets: {
                            applePay: 'auto',
                            googlePay: 'auto'
                        }
                    }}
                />
            </div>

            {/* 2. Optimized Address Form (Mobile Inputs) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 space-y-4">
                <h3 className="text-lg font-medium">Livraison</h3>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                    <input
                        type="text"
                        required
                        name="name"
                        id="name"
                        autoComplete="name"
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                        placeholder="Jean Dupont"
                    />
                </div>

                {/* Email (Input Mode: email) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        name="email"
                        id="email"
                        autoComplete="email"
                        inputMode="email"
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                        placeholder="jean@example.com"
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                        type="text"
                        required
                        name="address"
                        id="address"
                        autoComplete="shipping street-address"
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                        placeholder="12 rue de la Paix"
                    />
                </div>

                {/* City & Zip (Input Mode: numeric for zip) */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                        <input
                            type="text"
                            required
                            name="postalCode"
                            id="postalCode"
                            autoComplete="shipping postal-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                            placeholder="75000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                        <input
                            type="text"
                            required
                            name="city"
                            id="city"
                            autoComplete="shipping address-level2"
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                            placeholder="Paris"
                        />
                    </div>
                </div>

                {/* Phone (Input Mode: tel) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                        type="tel"
                        required
                        name="phone"
                        id="phone"
                        autoComplete="tel"
                        inputMode="tel"
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                        placeholder="+33 6 12 34 56 78"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={!stripe || isLoading}
                className="w-full bg-black text-white py-4 rounded-xl font-medium text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Payer maintenant'}
            </button>
        </form>
    );
}
