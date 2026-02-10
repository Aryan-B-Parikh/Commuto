'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trip } from '@/types';
import { RatingStars } from '@/components/ui/RatingStars';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';

interface TripCardProps {
    trip: Trip;
    variant?: 'default' | 'compact';
    showJoinButton?: boolean;
    onJoin?: (tripId: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
    trip,
    variant = 'default',
    showJoinButton = true,
    onJoin,
}) => {
    const handleJoin = () => {
        if (onJoin) {
            onJoin(trip.id);
        }
    };

    if (variant === 'compact') {
        return (
            <motion.div
                whileHover={{ y: -2 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <span>{formatDate(trip.date)}</span>
                            <span>•</span>
                            <span>{formatTime(trip.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">{trip.from.name}</span>
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            <span className="font-medium text-gray-900 truncate">{trip.to.name}</span>
                        </div>
                    </div>
                    <div className="text-right ml-4">
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(trip.pricePerSeat)}</p>
                        <p className="text-xs text-gray-500">{trip.seatsAvailable} seats left</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all"
        >
            {/* Route Info */}
            <div className="flex gap-4 mb-4">
                {/* Route Line */}
                <div className="flex flex-col items-center py-1">
                    <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100" />
                    <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                    <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100" />
                </div>

                {/* Locations */}
                <div className="flex-1 min-w-0">
                    <div className="mb-3">
                        <p className="font-semibold text-gray-900 truncate">{trip.from.name}</p>
                        <p className="text-sm text-gray-500 truncate">{trip.from.address}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 truncate">{trip.to.name}</p>
                        <p className="text-sm text-gray-500 truncate">{trip.to.address}</p>
                    </div>
                </div>

                {/* Price */}
                <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(trip.pricePerSeat)}</p>
                    <p className="text-sm text-gray-500">per seat</p>
                </div>
            </div>

            {/* Trip Details */}
            <div className="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-xl mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{formatDate(trip.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">{formatTime(trip.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">{trip.seatsAvailable} seats left</span>
                </div>
            </div>

            {/* Driver Info */}
            <div className="flex items-center justify-between">
                <Link href={`/profile/${trip.driver.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img
                        src={trip.driver.avatar}
                        alt={trip.driver.name}
                        className="w-10 h-10 rounded-full bg-gray-100"
                    />
                    <div>
                        <p className="font-medium text-gray-900">{trip.driver.name}</p>
                        <RatingStars rating={trip.driver.rating} size="sm" />
                    </div>
                </Link>

                {showJoinButton && trip.seatsAvailable > 0 && (
                    <Button onClick={handleJoin}>
                        Join Trip
                    </Button>
                )}
            </div>
        </motion.div>
    );
};
