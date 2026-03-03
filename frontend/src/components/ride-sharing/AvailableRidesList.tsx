'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatters';
import { Users, MapPin, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface AvailableRidesListProps {
    isMobile?: boolean;
}

export default function AvailableRidesList({ isMobile }: AvailableRidesListProps) {
    const [rides, setRides] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast() as any;

    useEffect(() => {
        const fetchRides = async () => {
            try {
                const data = await tripsAPI.getAvailableRides();
                setRides(data);
            } catch (error) {
                console.error('Failed to fetch available rides:', error);
                showToast('error', 'Failed to load available rides.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRides();
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-64 bg-[#111827]/50 animate-pulse rounded-3xl border border-[#1E293B]" />
                ))}
            </div>
        );
    }

    if (rides.length === 0) {
        return (
            <Card className="text-center py-20 bg-[#1E293B]/10 border-dashed border-2 border-[#1E293B]">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-[#F9FAFB] mb-2">No rides found</h3>
                <p className="text-[#9CA3AF]">Be the first to create a shared commute in your area!</p>
            </Card>
        );
    }

    if (isMobile) {
        return (
            <div className="flex flex-col h-full bg-[#0B1020] pb-24">
                <div className="flex-1 px-4 space-y-3">
                    {rides.map((ride, index) => (
                        <Link href={`/passenger/ride-details/${ride.id}`} key={ride.id} className="block">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-[#111827] rounded-2xl p-4 border border-[#1E293B] shadow-sm flex flex-col gap-2"
                            >
                                {/* Top Row: Route & Price */}
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[#F9FAFB] text-sm font-bold truncate leading-tight">
                                            {ride.origin_address.split(',')[0]} <span className="text-[#6B7280] font-normal mx-1">→</span> {ride.dest_address.split(',')[0]}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-[#F9FAFB] text-[15px] font-black leading-none">
                                            {formatCurrency(ride.price_per_seat || 0)}
                                        </p>
                                    </div>
                                </div>

                                {/* Second Row: Info */}
                                <div className="flex items-center gap-3 text-xs text-[#9CA3AF] font-medium">
                                    <div className="flex items-center gap-1 bg-[#1E293B] px-2 py-0.5 rounded-md">
                                        <Users size={10} className="text-indigo-400" />
                                        <span>{ride.available_seats} seats</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} className="text-[#6B7280]" />
                                        <span>
                                            {new Date(ride.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(ride.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rides.map((ride, index) => (
                <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group overflow-hidden border-t-4 border-t-indigo-500">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                                        {ride.total_seats - ride.available_seats} / {ride.total_seats}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Seats Joined</p>
                                        <p className="font-bold text-[#F9FAFB]">
                                            {ride.available_seats} available
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-indigo-400">{formatCurrency(ride.price_per_seat || 0)}</p>
                                    <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Per Person</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <div className="w-3 h-3 rounded-full border-2 border-indigo-500 bg-[#0B1020]" />
                                        <div className="w-0.5 h-10 bg-[#374151] ml-[5px] my-1" />
                                        <MapPin className="w-3 h-3 text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#F9FAFB] truncate mb-6">{ride.origin_address}</p>
                                        <p className="text-sm font-bold text-[#F9FAFB] truncate">{ride.dest_address}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-[#1E293B]/50">
                                <div className="flex items-center gap-2 text-[#9CA3AF]">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold">
                                        {new Date(ride.start_time).toLocaleDateString()} at {new Date(ride.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <Link href={`/passenger/ride-details/${ride.id}`}>
                                    <Button variant="outline" className="group-hover:bg-indigo-500 group-hover:text-white transition-all rounded-xl font-bold">
                                        Details <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
