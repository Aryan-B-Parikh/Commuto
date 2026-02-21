'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { walletAPI } from '@/services/api';
import { useToast } from '@/context/ToastContext';

interface SendMoneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    balance: number;
}

export const SendMoneyModal: React.FC<SendMoneyModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    balance
}) => {
    const [email, setEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const handleTransfer = async () => {
        if (!email || !email.includes('@')) {
            showToast('error', 'Please enter a valid email address');
            return;
        }

        const value = parseFloat(amount);
        if (!value || value <= 0) {
            showToast('error', 'Please enter a valid amount');
            return;
        }

        if (value > balance) {
            showToast('error', 'Insufficient wallet balance');
            return;
        }

        setIsLoading(true);

        try {
            const result = await walletAPI.transfer({
                recipient_email: email,
                amount: value,
                note: note
            });

            showToast('success', `Sent ₹${value} to ${result.recipient}`);
            onSuccess();
            onClose();
            // Reset form
            setEmail('');
            setAmount('');
            setNote('');
        } catch (error: any) {
            console.error('Transfer failed:', error);
            const msg = error.response?.data?.detail || 'Transfer failed. Check email and try again.';
            showToast('error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Money" size="sm">
            <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Available Balance</p>
                    <p className="text-2xl font-black text-indigo-600">₹{balance.toLocaleString('en-IN')}</p>
                </div>

                <Input
                    label="Recipient Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="friend@example.com"
                    type="email"
                />

                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold z-10 pt-6">₹</span>
                    <Input
                        label="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="number"
                        placeholder="0.00"
                        className="pl-8 text-lg font-bold"
                        min="1"
                    />
                </div>

                <Input
                    label="Note (Optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Dinner bill, Cab share, etc."
                />

                <Button
                    onClick={handleTransfer}
                    disabled={isLoading || !email || !amount}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold text-lg"
                >
                    {isLoading ? 'Sending...' : 'Send Money'}
                </Button>
            </div>
        </Modal>
    );
};
