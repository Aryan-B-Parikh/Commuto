'use client';

import React from 'react';
import { User } from '@/types';
import { RatingStars } from '@/components/ui/RatingStars';

interface PassengerListProps {
    passengers: User[];
    driver?: User;
    showRating?: boolean;
    compact?: boolean;
}

export const PassengerList: React.FC<PassengerListProps> = ({
    passengers,
    driver,
    showRating = true,
    compact = false,
}) => {
    const allMembers = driver ? [{ ...driver, isDriver: true }, ...passengers.map(p => ({ ...p, isDriver: false }))] : passengers.map(p => ({ ...p, isDriver: false }));

    if (compact) {
        return (
            <div className="flex items-center -space-x-2">
                {allMembers.slice(0, 4).map((member, index) => (
                    <div
                        key={member.id}
                        className="relative"
                        style={{ zIndex: allMembers.length - index }}
                    >
                        <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full border-2 border-white bg-gray-100"
                        />
                        {member.isDriver && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
                {allMembers.length > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        +{allMembers.length - 4}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {allMembers.map((member) => (
                <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                    <div className="relative">
                        <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-12 h-12 rounded-full bg-gray-100"
                        />
                        {member.isDriver && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{member.name}</p>
                            {member.isDriver && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                    Driver
                                </span>
                            )}
                            {member.verified && (
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                            )}
                        </div>
                        {showRating && <RatingStars rating={member.rating} size="sm" />}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">{member.totalTrips} trips</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
