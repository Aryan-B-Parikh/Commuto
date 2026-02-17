"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

export default function WalletPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'balance' | 'methods' | 'history'>('balance');

    const transactions = [
        { id: '1', desc: 'Ride to Downtown', date: 'Feb 14, 2024', amount: -15.50, type: 'payment' },
        { id: '2', desc: 'Top Up', date: 'Feb 12, 2024', amount: 50.00, type: 'credit' },
        { id: '3', desc: 'Refund: Cancelled Ride', date: 'Feb 10, 2024', amount: 12.00, type: 'credit' },
        { id: '4', desc: 'Airport Express', date: 'Feb 08, 2024', amount: -32.00, type: 'payment' },
    ];

    return (
        <DashboardLayout userType="passenger" title="My Wallet">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Balance & Methods */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Primary Balance Card */}
                    <Card className="relative overflow-hidden border-none shadow-lg dark:glass bg-gradient-to-br from-indigo-600/10 to-purple-600/10 backdrop-blur-md">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />

                        <div className="p-8 pb-12">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Available Balance</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-foreground">{formatCurrency(142.50)}</span>
                                        <span className="text-emerald-500 font-bold text-sm">↑ 12%</span>
                                    </div>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/50 dark:bg-slate-900 shadow-inner flex items-center justify-center text-2xl">
                                    💳
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 font-black uppercase tracking-widest text-white border-none">
                                    Add Money
                                </Button>
                                <Button variant="outline" className="flex-1 h-14 border-indigo-200 dark:border-slate-800 font-black uppercase tracking-widest">
                                    Send
                                </Button>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-8 py-4 bg-white/50 dark:bg-slate-900 border-t border-indigo-50 dark:border-slate-800 flex justify-between items-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Linked: Visa •••• 4242</p>
                            <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Change</button>
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
                                    {transactions.map((tx, index) => (
                                        <div key={tx.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-50 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                    {tx.type === 'credit' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">{tx.desc}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">{tx.date}</p>
                                                </div>
                                            </div>
                                            <span className={`font-black ${tx.type === 'credit' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                                                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                            </span>
                                        </div>
                                    ))}
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
                            <div className="p-4 rounded-2xl bg-slate-900 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-6 bg-yellow-500/80 rounded flex items-center justify-center text-[10px] font-black">CHIP</div>
                                        <span className="text-xs font-bold opacity-60">VISA</span>
                                    </div>
                                    <p className="font-mono text-sm tracking-[0.2em] mb-4">•••• •••• •••• 4242</p>
                                    <div className="flex justify-between items-end">
                                        <p className="text-[8px] font-bold uppercase opacity-60">Exp: 12/26</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest">{user?.name || 'USER NAME'}</p>
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full h-12 dashed border-2 border-gray-100 dark:border-slate-800 text-gray-400 font-bold text-xs uppercase tracking-widest">
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
