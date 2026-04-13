'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock3, MapPin, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { tripsAPI } from '@/services/api';
import { TripResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatters';

interface AvailableRidesListProps {
    isMobile?: boolean;
}

export default function AvailableRidesList({ isMobile }: AvailableRidesListProps) {
    const [rides, setRides] = useState<TripResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

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
    }, [showToast]);

    if (isLoading) {
        return (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-56 rounded-[28px] bg-card animate-pulse" />)}
            </div>
        );
    }

    if (rides.length === 0) {
        return (
            <Card className="rounded-[28px] border-dashed text-center" padding="lg">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
                    <Users className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-foreground">No shared rides yet</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Be the first to create a trip in your area or check back after refining your route.</p>
            </Card>
        );
    }

    return (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>
            {rides.map((ride, index) => (
                <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card hoverable className="rounded-[28px] overflow-hidden" padding="lg">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                    {ride.available_seats} seats left
                                </div>
                                <p className="mt-4 text-lg font-semibold text-foreground">{ride.origin_address.split(',')[0]}</p>
                                <p className="mt-1 text-sm text-muted-foreground">to {ride.dest_address.split(',')[0]}</p>
                            </div>
                            <div className="rounded-[22px] bg-background/60 px-4 py-3 text-right">
                                <p className="text-xl font-bold text-foreground">{formatCurrency(ride.total_price || 0)}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(ride.price_per_seat || 0)} per seat</p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[22px] border border-card-border bg-background/50 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Clock3 className="h-4 w-4 text-primary" />
                                    Departure
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {new Date(ride.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(ride.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="rounded-[22px] border border-card-border bg-background/50 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <MapPin className="h-4 w-4 text-emerald-400" />
                                    Availability
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{ride.available_seats} of {ride.total_seats} seats available right now</p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-4 border-t border-card-border pt-5">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Transparent pricing</p>
                                <p className="text-sm text-muted-foreground">See seats, schedule, and fare before opening details.</p>
                            </div>
                            <Link href={`/passenger/ride-details/${ride.id}`}>
                                <Button variant="outline" className="gap-2">
                                    View details
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
