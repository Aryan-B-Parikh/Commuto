'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { walletAPI } from '@/services/api';
import { useToast } from '@/context/ToastContext';

interface AddMoneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [amount, setAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    // Predefined amounts for quick selection
    const QUICK_AMOUNTS = [100, 500, 1000, 2000];

    const handlePayment = async () => {
        const value = parseInt(amount);
        if (!value || value < 1) {
            showToast('error', 'Please enter a valid amount');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Create Order on Backend
            const order = await walletAPI.addMoney(value);

            // 2. Open Razorpay Checkout
            const options = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: "Commuto Wallet",
                description: "Add Money to Wallet",
                order_id: order.order_id,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment on Backend
                        const result = await walletAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (result.status === 'success') {
                            showToast('success', `Successfully added ₹${value} to wallet!`);
                            onSuccess();
                            onClose();
                            setAmount('');
                        } else {
                            showToast('error', 'Payment verification failed');
                        }
                    } catch (err) {
                        console.error('Verification Error:', err);
                        showToast('error', 'Failed to verify payment');
                    }
                },
                prefill: {
                    name: "User Name", // Ideally get from auth context
                    email: "user@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#4F46E5"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment Error:', error);
            showToast('error', 'Failed to initiate payment');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Money to Wallet" size="sm">
            <div className="space-y-6">
                <div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 font-bold z-10 pt-6">₹</span>
                        <Input
                            label="Enter Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            type="number"
                            placeholder="0.00"
                            className="pl-8 text-lg font-bold"
                            min="1"
                        />
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {QUICK_AMOUNTS.map((val) => (
                        <button
                            key={val}
                            onClick={() => setAmount(val.toString())}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border
                ${amount === val.toString()
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-muted text-muted-foreground border-card-border hover:border-indigo-300'
                                }`}
                        >
                            ₹{val}
                        </button>
                    ))}
                </div>

                <Button
                    onClick={handlePayment}
                    disabled={isLoading || !amount}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-bold"
                >
                    {isLoading ? 'Processing...' : `Pay ₹${amount || '0'}`}
                </Button>
            </div>
        </Modal>
    );
};
