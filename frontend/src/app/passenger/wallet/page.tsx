"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Send, ShieldCheck, Wallet2 } from 'lucide-react';
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
import { RoleGuard } from '@/components/auth/RoleGuard';

interface WalletTransaction {
    id: string;
    type: 'credit' | 'debit' | string;
    description?: string;
    created_at: string;
    amount: number;
}

interface PaymentMethod {
    id: string;
    brand?: string;
    last4?: string;
    expiry?: string;
    is_default?: boolean;
}

export default function WalletPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [balance, setBalance] = useState({ balance: 0, currency: 'INR' });
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
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
            <DashboardLayout userType="passenger" title="Wallet & Payments">
                <div className="mx-auto max-w-7xl space-y-8">
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                        <Card
                            variant="outline"
                            className="overflow-hidden border-transparent !bg-[linear-gradient(135deg,#0f172a,#12356f_65%,#1a6bff)] text-white shadow-[var(--shadow-soft)]"
                            padding="lg"
                        >
                            <div className="space-y-8">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-white/90">Available balance</p>
                                        <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">{formatCurrency(balance.balance)}</h1>
                                        <p className="mt-3 text-sm text-white/90">Use wallet balance for faster checkout on upcoming rides.</p>
                                    </div>
                                    <div className="rounded-[24px] bg-white/10 p-4 backdrop-blur-sm">
                                        <Wallet2 className="h-7 w-7" />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <Button className="bg-white text-primary hover:bg-white/92" onClick={() => setIsAddMoneyOpen(true)}>
                                        <Plus className="h-4 w-4" /> Add money
                                    </Button>
                                    <Button variant="outline" className="border-white/35 text-white hover:bg-white/15" onClick={() => setIsSendMoneyOpen(true)}>
                                        <Send className="h-4 w-4" /> Send money
                                    </Button>
                                    <Button variant="outline" className="border-white/35 text-white hover:bg-white/15" onClick={() => setIsAddCardOpen(true)}>
                                        <CreditCard className="h-4 w-4" /> Add card
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <Card padding="lg">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Payments designed for trust</p>
                                    <p className="text-sm text-muted-foreground">Saved cards, trip checkout, and wallet actions are now easier to scan.</p>
                                </div>
                            </div>
                            <div className="mt-6 space-y-3">
                                <div className="rounded-[24px] border border-card-border bg-background/55 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Primary rider</p>
                                    <p className="mt-2 text-lg font-semibold text-foreground">{user?.name || 'Passenger'}</p>
                                    <p className="text-sm text-muted-foreground">{user?.email || 'Wallet connected'}</p>
                                </div>
                                <div className="rounded-[24px] border border-card-border bg-background/55 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Payment methods</p>
                                    <p className="mt-2 text-3xl font-bold text-foreground">{paymentMethods.length}</p>
                                    <p className="text-sm text-muted-foreground">Cards and payment sources ready for checkout.</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <Card padding="lg">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Payment methods</p>
                                    <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Saved cards</h2>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setIsAddCardOpen(true)}>Add new</Button>
                            </div>

                            <div className="space-y-3">
                                {paymentMethods.length > 0 ? paymentMethods.map((method, index) => (
                                    <motion.div key={method.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                        <div className="rounded-[24px] border border-card-border bg-background/55 p-4 transition-all hover:border-primary/20 hover:bg-muted/40">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-semibold uppercase">
                                                        {(method.brand || 'Card').slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">**** {method.last4}</p>
                                                        <p className="text-sm text-muted-foreground">Expires {method.expiry || 'MM/YY'}</p>
                                                    </div>
                                                </div>
                                                {method.is_default && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400">Primary</span>}
                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="rounded-[24px] border border-dashed border-card-border p-8 text-sm text-muted-foreground">
                                        No saved payment methods yet. Add a card to make ride checkout faster.
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card padding="lg">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Transactions</p>
                                    <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Wallet activity</h2>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {isLoading ? (
                                    [1, 2, 3].map((item) => <div key={item} className="h-20 rounded-[24px] bg-muted animate-pulse" />)
                                ) : transactions.length > 0 ? (
                                    transactions.map((tx, index) => (
                                        <motion.div key={tx.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                                            <div className="flex items-center justify-between gap-4 rounded-[24px] border border-card-border bg-background/55 px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                        {tx.type === 'credit' ? <Plus className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{tx.description || tx.type}</p>
                                                        <p className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <p className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-foreground'}`}>
                                                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="rounded-[24px] border border-dashed border-card-border p-8 text-sm text-muted-foreground">
                                        No recent transactions yet. Wallet top-ups and ride payments will appear here.
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                <AddMoneyModal isOpen={isAddMoneyOpen} onClose={() => setIsAddMoneyOpen(false)} onSuccess={fetchWalletData} />
                <AddCardModal isOpen={isAddCardOpen} onClose={() => setIsAddCardOpen(false)} onSuccess={fetchWalletData} />
                <SendMoneyModal isOpen={isSendMoneyOpen} onClose={() => setIsSendMoneyOpen(false)} onSuccess={fetchWalletData} balance={balance.balance} />
            </DashboardLayout>
        </RoleGuard>
    );
}
