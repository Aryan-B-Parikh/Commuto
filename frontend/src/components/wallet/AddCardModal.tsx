'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { paymentMethodsAPI } from '@/services/api';
import { useToast } from '@/context/ToastContext';

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const handleFormatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
        const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        setCardNumber(formatted);
    };

    const handleFormatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 2) {
            setExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
        } else {
            setExpiry(val);
        }
    };

    const handleSubmit = async () => {
        if (cardNumber.replace(/\s/g, '').length < 16 || !expiry || !cvv || !name) {
            showToast('error', 'Please fill all fields correctly');
            return;
        }

        setIsLoading(true);
        try {
            // Determine provider based on first digit (Simple check)
            const firstDigit = cardNumber[0];
            const provider = firstDigit === '4' ? 'Visa' : firstDigit === '5' ? 'Mastercard' : 'Card';
            const last4 = cardNumber.replace(/\s/g, '').slice(-4);

            await paymentMethodsAPI.addMethod({
                type: 'card',
                provider,
                last4,
                is_default: true // Make new card default by default
            });

            showToast('success', 'Card added successfully');
            onSuccess();
            onClose();
            // Reset form
            setCardNumber('');
            setExpiry('');
            setCvv('');
            setName('');
        } catch (error) {
            console.error('Failed to add card:', error);
            showToast('error', 'Failed to add card');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Card" size="md">
            <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl text-white shadow-lg mb-6">
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-12 h-8 bg-yellow-500/80 rounded-md" />
                        <span className="font-bold tracking-widest uppercase text-white/50">
                            {cardNumber[0] === '4' ? 'VISA' : cardNumber[0] === '5' ? 'MASTERCARD' : 'CARD'}
                        </span>
                    </div>
                    <div className="text-xl font-mono tracking-widest mb-4 h-8">
                        {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[10px] font-bold text-white/50 uppercase">Card Holder</div>
                            <div className="text-sm font-bold tracking-wider uppercase">{name || 'YOUR NAME'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-white/50 uppercase">Expires</div>
                            <div className="text-sm font-bold tracking-wider">{expiry || 'MM/YY'}</div>
                        </div>
                    </div>
                </div>

                <Input
                    label="Card Number"
                    value={cardNumber}
                    onChange={handleFormatCardNumber}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Expiry Date"
                        value={expiry}
                        onChange={handleFormatExpiry}
                        placeholder="MM/YY"
                        maxLength={5}
                    />
                    <Input
                        label="CVV"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        type="password"
                        placeholder="123"
                        maxLength={3}
                    />
                </div>

                <Input
                    label="Cardholder Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="JOHN DOE"
                />

                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold"
                >
                    {isLoading ? 'Adding Card...' : 'Add Card'}
                </Button>
            </div>
        </Modal>
    );
};
