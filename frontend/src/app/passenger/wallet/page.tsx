"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { walletAPI, paymentMethodsAPI } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { AddMoneyModal } from '@/components/wallet/AddMoneyModal';
import { AddCardModal } from '@/components/wallet/AddCardModal';
import { SendMoneyModal } from '@/components/wallet/SendMoneyModal';

export default function WalletPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'balance' | 'methods' | 'history'>('balance');
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [cards, setCards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);

    const fetchWalletData = useCallback(async () => {
        try {
            const [walletData, txData, cardsData] = await Promise.all([
                walletAPI.getWallet(),
                walletAPI.getTransactions(),
                paymentMethodsAPI.getMethods()
            ]);
            setBalance(walletData.balance);
            setTransactions(txData);
            setCards(cardsData);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const defaultCard = cards.find(c => c.is_default) || cards[0];

    return (
        <DashboardLayout userType="passenger" title="My Wallet">
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
                balance={balance}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Balance & Methods */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Primary Balance Card */}
                    <Card className="relative overflow-hidden border-none shadow-lg dark:glass bg-gradient-to-br from-indigo-600/10 to-purple-600/10 backdrop-blur-md">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />

                        <div className="p-8 pb-12">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Available Balance</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-foreground">
                                            {isLoading ? '...' : formatCurrency(balance)}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/50 dark:bg-slate-900 shadow-inner flex items-center justify-center text-2xl">
                                    💳
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={() => setIsAddMoneyOpen(true)}
                                    className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 font-black uppercase tracking-widest text-white border-none"
                                >
                                    Add Money
                                </Button>
                                <Button
                                    onClick={() => setIsSendMoneyOpen(true)}
                                    variant="outline"
                                    className="flex-1 h-14 border-indigo-200 dark:border-slate-800 font-black uppercase tracking-widest"
                                >
                                    Send
                                </Button>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-8 py-4 bg-white/50 dark:bg-slate-900 border-t border-indigo-50 dark:border-slate-800 flex justify-between items-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Linked: {defaultCard ? `${defaultCard.provider} •••• ${defaultCard.last4}` : 'None'}
                            </p>
                            <button
                                onClick={() => setIsAddCardOpen(true)}
                                className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                            >
                                Change
                            </button>
                        </div>
                    </Card>

                    {/* Tabs Section */}
                    <div className="space-y-6">
                        <div className="flex gap-8 border-b border-gray-100 dark:border-slate-800">
                            {['balance', 'methods', 'history'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div layoutId="wallet-tab" className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'balance' && (
                                <motion.div
                                    key="balance"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <h3 className="text-lg font-bold text-foreground">Recent Transactions</h3>
                                    {transactions.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">No transactions yet</div>
                                    ) : (
                                        transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-50 dark:border-slate-800 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'credit' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'
                                                        }`}>
                                                        {tx.type === 'credit' ? '↓' : '↑'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm">{tx.description || tx.type}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-gray-400 font-bold">
                                                                {new Date(tx.created_at).toLocaleDateString()}
                                                            </p>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                                                                ${tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-red-100 text-red-700'}`}>
                                                                {tx.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`font-black ${tx.type === 'credit' ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Cards & Offers */}
                <div className="space-y-6">
                    <Card className="dark:glass border-none shadow-sm">
                        <h3 className="text-lg font-bold text-foreground mb-6">Your Cards</h3>
                        <div className="space-y-4">
                            {cards.length === 0 ? (
                                <div className="text-center text-sm text-gray-400 py-4">No cards added</div>
                            ) : (
                                cards.map((card) => (
                                    <div key={card.id} className="p-4 rounded-2xl bg-slate-900 text-white relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-6 bg-yellow-500/80 rounded flex items-center justify-center text-[10px] font-black">CHIP</div>
                                                <span className="text-xs font-bold opacity-60 uppercase">{card.provider}</span>
                                            </div>
                                            <p className="font-mono text-sm tracking-[0.2em] mb-4">•••• •••• •••• {card.last4}</p>
                                            <div className="flex justify-between items-end">
                                                <p className="text-[8px] font-bold uppercase opacity-60">Exp: {card.expiry || '12/26'}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest">{user?.name || 'USER'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            <Button
                                onClick={() => setIsAddCardOpen(true)}
                                variant="outline"
                                className="w-full h-12 dashed border-2 border-gray-100 dark:border-slate-800 text-gray-400 font-bold text-xs uppercase tracking-widest"
                            >
                                Add New Card
                            </Button>
                        </div>
                    </Card>

                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="font-black text-xl mb-1 italic tracking-tighter">REFER & EARN $50</h4>
                            <p className="text-sm text-purple-100 leading-snug mb-6">Invite your friends to Commuto and get $50 credit for your next 5 rides.</p>
                            <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest">
                                Invite Friends
                            </Button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:rotate-12 transition-transform">💎</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
