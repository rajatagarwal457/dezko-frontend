import { PREMIUM_PRICE_INR } from '../constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

declare global {
    interface Window {
        Razorpay: any;
    }
}

export interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
}

export interface PaymentVerificationResponse {
    success: boolean;
    isPremium: boolean;
    message?: string;
}

export const razorpayService = {
    /**
     * Create a Razorpay order via backend
     */
    async createOrder(userId: string): Promise<RazorpayOrder> {
        const response = await fetch(`${API_BASE_URL}/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                amount: PREMIUM_PRICE_INR * 100, // Razorpay expects amount in paise
                currency: 'INR'
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(error.detail || 'Failed to create payment order');
        }

        return response.json();
    },

    /**
     * Verify payment after Razorpay checkout completes
     */
    async verifyPayment(
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string,
        userId: string
    ): Promise<PaymentVerificationResponse> {
        const response = await fetch(`${API_BASE_URL}/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                razorpay_order_id: razorpayOrderId,
                razorpay_payment_id: razorpayPaymentId,
                razorpay_signature: razorpaySignature,
                userId
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(error.detail || 'Payment verification failed');
        }

        return response.json();
    },

    /**
     * Open Razorpay checkout modal
     */
    openCheckout(
        order: RazorpayOrder,
        userInfo: { name: string; email?: string },
        onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void,
        onFailure: (error: any) => void
    ): void {
        if (!window.Razorpay) {
            onFailure(new Error('Razorpay SDK not loaded. Please refresh the page.'));
            return;
        }

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Vireo',
            description: 'Unlimited Video Generation - Lifetime Access',
            order_id: order.id,
            handler: function (response: any) {
                onSuccess({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                });
            },
            prefill: {
                name: userInfo.name,
                email: userInfo.email || ''
            },
            theme: {
                color: '#14B8A6' // vireo-teal
            },
            modal: {
                ondismiss: function () {
                    onFailure(new Error('Payment cancelled by user'));
                }
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
            onFailure(new Error(response.error?.description || 'Payment failed'));
        });
        razorpay.open();
    },

    /**
     * Load Razorpay script dynamically if not already loaded
     */
    loadScript(): Promise<boolean> {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }
};
