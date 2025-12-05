import React, { useState } from 'react';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';
import { FREE_GENERATION_LIMIT, PREMIUM_PRICE_INR } from '../constants';
import { razorpayService } from '../services/razorpayService';
import { quotaStore } from '../services/quotaStore';
import Button from './Button';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPaymentSuccess: () => void;
    userId: string;
    userName: string;
    userEmail?: string;
    remainingGenerations: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    onPaymentSuccess,
    userId,
    userName,
    userEmail,
    remainingGenerations
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // Load Razorpay script if needed
            const loaded = await razorpayService.loadScript();
            if (!loaded) {
                throw new Error('Failed to load payment gateway');
            }

            // Create order on backend
            const order = await razorpayService.createOrder(userId);

            // Open Razorpay checkout
            razorpayService.openCheckout(
                order,
                { name: userName, email: userEmail },
                async (response) => {
                    try {
                        // Verify payment on backend
                        const verification = await razorpayService.verifyPayment(
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature,
                            userId
                        );

                        if (verification.success) {
                            // Update local quota
                            quotaStore.upgradeToPremium(userId);
                            onPaymentSuccess();
                        } else {
                            setError('Payment verification failed. Please contact support.');
                        }
                    } catch (err) {
                        setError('Payment verification failed. Please contact support.');
                    }
                    setIsProcessing(false);
                },
                (err) => {
                    if (err.message !== 'Payment cancelled by user') {
                        setError(err.message || 'Payment failed. Please try again.');
                    }
                    setIsProcessing(false);
                }
            );
        } catch (err: any) {
            setError(err.message || 'Failed to initiate payment');
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                {/* Content */}
                <div className="text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-vireo-teal to-vireo-purple rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-vireo-dark dark:text-white mb-2">
                        {remainingGenerations <= 0
                            ? "You've used all free videos! 🎬"
                            : "Upgrade to Unlimited"}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-gray-500 mb-6">
                        {remainingGenerations <= 0
                            ? `You've enjoyed your ${FREE_GENERATION_LIMIT} free videos.`
                            : `You have ${remainingGenerations} free videos left.`}
                    </p>

                    {/* Price */}
                    <div className="bg-vireo-teal/10 rounded-2xl p-6 mb-6">
                        <div className="text-4xl font-black text-vireo-teal mb-1">
                            ₹{PREMIUM_PRICE_INR}
                        </div>
                        <div className="text-sm text-gray-500">
                            One-time payment • Lifetime access
                        </div>
                    </div>

                    {/* Benefits */}
                    <ul className="text-left space-y-3 mb-8">
                        {[
                            'Unlimited video generations',
                            'Priority processing',
                            'Support indie development ❤️'
                        ].map((benefit, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <div className="w-5 h-5 bg-vireo-teal/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-vireo-teal" />
                                </div>
                                {benefit}
                            </li>
                        ))}
                    </ul>

                    {/* Error */}
                    {error && (
                        <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* CTA */}
                    <Button
                        size="lg"
                        variant="primary"
                        className="w-full text-lg"
                        onClick={handleUpgrade}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            'Upgrade Now ✨'
                        )}
                    </Button>

                    {/* Skip for now */}
                    {remainingGenerations > 0 && (
                        <button
                            onClick={onClose}
                            className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Maybe later
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
