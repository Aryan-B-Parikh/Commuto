"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { walletAPI, paymentMethodsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { AddMoneyModal } from '@/components/wallet/AddMoneyModal';
import { AddCardModal } from '@/components/wallet/AddCardModal';
import { SendMoneyModal } from '@/components/wallet/SendMoneyModal';
import { Modal } from '@/components/ui/Modal';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function WalletPage() {
    const { user } = useAuth();
    const { showToast } = useToast() as any;
    const [balance, setBalance] = useState({ balance: 0, currency: 'USD' });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);

    const fetchWalletData = useCallback(async () => {
        try {
            const [walletData, txData, methodsData] = await Promise.all([
                walletAPI.getWallet(),
                walletAPI.getTransactions(),
                paymentMethodsAPI.getMethods()
            ]);
            setBalance(walletData);
            setTransactions(txData);
            setPaymentMethods(methodsData);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
            showToast('error', 'Failed to load wallet data');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    return (
        <RoleGuard allowedRoles={['passenger']}>
            <DashboardLayout userType="passenger" title="My Wallet">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Balance & Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Balance Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="bg-gradient-to-br from-teal-600 to-emerald-700 border-none p-1 shadow-2xl overflow-hidden relative group rounded-sm">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110" />
                                <div className="bg-transparent px-8 py-10 rounded-sm relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-teal-100 text-xs font-black uppercase tracking-widest mb-2 opacity-80">Total Available Balance</p>
                                            <h2 className="text-6xl font-black text-white italic tracking-tighter leading-none">
                                                {formatCurrency(balance.balance)}
                                            </h2>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-sm flex items-center justify-center text-3xl border border-white/20">
                                            💰
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <Button
                                            variant="primary"
                                            className="bg-white text-teal-600 hover:bg-teal-50 font-black italic tracking-widest uppercase py-6 px-10 rounded-sm shadow-xl transition-all hover:-translate-y-1"
                                            onClick={() => setIsAddMoneyOpen(true)}
                                        >
                                            + Add Cash
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-black italic tracking-widest uppercase py-6 px-10 rounded-xl backdrop-blur-md"
                                            onClick={() => setIsSendMoneyOpen(true)}
                                        >
                                            Send Money
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Payment Methods */}
                        <section>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-[#F9FAFB] italic tracking-tighter uppercase flex items-center gap-3 flex-1">
                                    Payment Methods
                                    <span className="h-0.5 flex-1 bg-[#1E293B]" />
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs font-bold text-teal-400 uppercase tracking-widest"
                                    onClick={() => setIsAddCardOpen(true)}
                                >
                                    + Add New
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paymentMethods.map((method, i) => (
                                    <motion.div
                                        key={method.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Card hoverable className="border-none shadow-sm px-6 py-5 relative group border-2 border-transparent hover:border-teal-500/20 rounded-sm">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-8 bg-[#1E293B] rounded flex items-center justify-center font-bold text-xs uppercase text-[#9CA3AF]">
                                                        {method.brand || 'CARD'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[#F9FAFB] tracking-widest">•••• {method.last4}</p>
                                                        <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Expires {method.expiry || 'MM/YY'}</p>
                                                    </div>
                                                </div>
                                                {method.is_default && (
                                                    <span className="text-[8px] font-black bg-green-500/10 text-green-400 px-2 py-1 rounded-full uppercase tracking-tighter">Primary</span>
                                                )}
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                                {paymentMethods.length === 0 && (
                                    <div className="col-span-full py-10 text-center border-2 border-dashed border-[#1E293B] rounded-2xl">
                                        <p className="text-sm text-[#6B7280] font-medium">No payment methods added yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Transaction History */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-[#F9FAFB] italic tracking-tighter uppercase flex items-center gap-3">
                            Activity
                            <span className="h-0.5 flex-1 bg-[#1E293B]" />
                        </h3>

                        <Card className="border-none shadow-sm p-0 overflow-hidden">
                            <div className="divide-y divide-[#1E293B]">
                                {transactions.length > 0 ? (
                                    transactions.map((tx, i) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="px-6 py-4 flex items-center justify-between hover:bg-[#1E293B]/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'credit' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {tx.type === 'credit' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#F9FAFB] text-sm italic tracking-tighter">{tx.description || tx.type}</p>
                                                    <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">{new Date(tx.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <p className={`font-black italic tracking-tighter ${tx.type === 'credit' ? 'text-green-400' : 'text-[#F9FAFB]'
                                                }`}>
                                                {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center px-6">
                                        <p className="text-sm text-[#6B7280] font-medium">No recent transactions to show.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Modals */}
                <AddMoneyModal
                    isOpen={isAddMoneyOpen}
                    onClose={() => setIsAddMoneyOpen(false)}
                    onSuccess={fetchWalletData}
                />
                <AddCardModal
                    isOpen={isAddCardOpen}
                    onClose={() => setIsAddCardOpen(false)}
                    onSuccess={fetchWalletData}
                />
                <SendMoneyModal
                    isOpen={isSendMoneyOpen}
                    onClose={() => setIsSendMoneyOpen(false)}
                    onSuccess={fetchWalletData}
                    balance={balance.balance}
                />
            </DashboardLayout>
        </RoleGuard>
    );
}
