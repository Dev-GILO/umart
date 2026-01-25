'use client';

import React, { ReactNode } from 'react';

interface PaystackConfig {
  publicKey: string;
}

const paystackConfig: PaystackConfig = {
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
};

// Load Paystack script
function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.head.appendChild(script);
  });
}

export interface PaymentConfig {
  email: string;
  amount: number;
  reference: string;
  onSuccess?: (reference: string) => void;
  onClose?: () => void;
  metadata?: Record<string, unknown>;
}

export function initializePayment(config: PaymentConfig) {
  return loadPaystackScript().then(() => {
    if (!window.PaystackPop) {
      throw new Error('Paystack not loaded');
    }

    return new Promise<string>((resolve, reject) => {
      window.PaystackPop.setup({
        key: paystackConfig.publicKey,
        email: config.email,
        amount: config.amount * 100, // Convert to kobo
        ref: config.reference,
        onClose: () => {
          config.onClose?.();
          reject(new Error('Payment cancelled'));
        },
        onSuccess: (response) => {
          config.onSuccess?.(response.reference);
          resolve(response.reference);
        },
      }).openIframe();
    });
  });
}

export function PaystackProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
